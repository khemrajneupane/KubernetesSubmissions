# Ex_5.1. DIY CRD (CustomResourceDefinition) & Controller

- We will define the website URL (https://example.com/) in a DummySite resource.
- the controller detects the new DummySite resource.
- the controller downloads the HTML and other assets if possibel.
- the controller creates resources such as a ConfigMap, Deployment, and Service to serve the copied website.
- open the copied website through its Kubernetes Service.

- added controller and manifests folders inside ex_5.1
- create a `manifests/crd.yaml` with group, kind, scope, with required website_url of type string, etc.

### apply CRD:

```sh
kubectl apply -f ex_5.1/manifests/crd.yaml
```

`customresourcedefinition.apiextensions.k8s.io/dummysites.stable.dwk created`

- verify it exists:

```sh
kubectl get crd dummysites.stable.dwk
```

```table
NAME                    CREATED AT
dummysites.stable.dwk   2026-10-29T12:31:34Z
```

- create role config to allow controller permission to work with Kubernetes resources.
- role config for ServiceAccount, Role and RoleBinding all in default namespace.

### setup the controller project:

- it watches DummySite, reads the website_url and downloads HTML, creates Kubernetes resources to use that downloaded HTML.
- in controller folder we can initialize node.js project because we are going to install Javascript client library of Kubernetes.
- Initially for testing we make controller only watch for DummySite events and log them. Downloading website part will be done then.

```sh
npm init -y
npm install @kubernetes/client-node
```

- now to run the controller inside pod kubernetes needs a container image which we build out of controller/index.js. We add a Dockerfile for this.

```sh
docker build -t dummysite-controller:dev ./ex_5.1/controller
```

- load image into k3d:

```sh
k3d image import dummysite-controller:dev -c k3s-default
```

- verified cluster is reachable:

```sh
kubectl cluster-info
```

- create controller deployment. Permissions must be applied before the Deployment:

```sh
kubectl apply -f ex_5.1/manifests/role.yaml
kubectl apply -f ex_5.1/manifests/deployment.yaml
```

- check pods:

```sh
kubectl get pods -n default -l app=dummysite-controller
```

```table
NAME                                    READY   STATUS    RESTARTS   AGE
dummysite-controller-6d65c868d4-bttln   1/1     Running   0          5s
```

- so, controller is running successfully in kubernetes.
- - - check controller logs:

```sh
- - - kubectl logs deployment/dummysite-controller -n default --follow
```

- create dummysite resource in manifests/dummysite.yaml and apply

```sh
kubectl apply -f ex_5.1/manifests/dummysite.yaml
```

- then check whether controller is receiving DummySite events:

```sh
kubectl logs deployment/dummysite-controller -n default
```

```table
Event received: ADDED
DummySite name: example-site
Website URL: https://example.com/
```

- next, we add the logic in controller to download and display website. The idea is when Kubernetes sends an `ADDED event`, our controller receives the DummySite object. We can use the object `object.spec.website_url` to download the HTML.
- we further create helper function that takes url (object.spec.website_url) and extracts response.text. Once controller confirms `ADDED event` we then initiate the helper function to extract HTML texts.
- re-build image, import and rollout restart deployment/dummysite-controller in default namespace:

```sh
docker build -t dummysite-controller:dev ./ex_5.1/controller
```

- load image into k3d:

```sh
k3d image import dummysite-controller:dev -c k3s-default
```

```sh
kubectl rollout restart deployment/dummysite-controller -n default
```

- check new controller pod is running and old is terminating:

```sh
kubectl get pods -n default -l app=dummysite-controller
```

```table
NAME                                    READY   STATUS        RESTARTS   AGE
dummysite-controller-6f987d47f4-kvws8   1/1     Running       0          10s
dummysite-controller-74d944f4cd-6758z   1/1     Terminating   0          16h
```

- check controller logs:

```sh
kubectl logs deployment/dummysite-controller -n default --tail=50
```

- above logs:

```table
DummySite controller starting...
Watching DummySite resources in namespace: default
Starting DummySite watch...
DummySite name: example-site
Website URL: https://example.com/
Downloading website: https://example.com/
Downloaded 577 characters of HTML
Retrying watch in 3 seconds...
```

- now controller is properly downloading website, now we need to create a ConfigMap containing the downloaded HTML
- we add CoreV1Api to cubeconfig to make makeApiClient becaue we need to create client to communicate with kubernetes resources like ConfigMaps, services.
- we also create namespacedConfigMap helper function that creates configmap with metadata name as example-site-html, namespace default and data contains the above downloaded html.
- configMap is needed because we need to store downloaded html contents.

- Again, re-build image, import and rollout restart deployment/dummysite-controller in default namespace:

```sh
docker build -t dummysite-controller:dev ./ex_5.1/controller
```

- load image into k3d:

```sh
k3d image import dummysite-controller:dev -c k3s-default
```

```sh
kubectl rollout restart deployment/dummysite-controller -n default
```

- check configmap:

```sh
kubectl get configmap example-site-html -n default
```

```table
NAME                DATA   AGE
example-site-html   1      30m
```

- inspect `example-site-html` to make sure the html content if populated in key `index.html`:

```sh
kubectl get configmap example-site-html -n default -o yaml
```

- the above outputs entire yaml and that contains the html contents as expected:

```table
apiVersion: v1
data:
  index.html: |
    <!doctype html><html lang=en><head><meta charset=utf-8><link rel=icon href=data:,><meta name=viewport content="width=device-width,initial-scale=1"><title>Example Domain</title><style>html{color-scheme:light dark;background:light-dark(#eee,#222)}body{font:16px/1.6 system-ui,sans-serif;max-width:26em;margin:auto;padding:25vh 2em 2em;text-align:center}</style></head><body><p>This domain is for use in documentation examples without needing permission. This is not a service; avoid relying on it for testing and monitoring purposes.</p><script src=/s.js></script></body></html>
kind: ConfigMap
metadata:
  creationTimestamp: "2026-10-30T12:07:51Z"
  name: example-site-html
  namespace: default
  resourceVersion: "1923437"
  uid: b6f6b4e9-d28f-404b-b17b-30d78a26c15a
```

- now we need web server that runs the HTML stored in the ConfigMap. We can use nginx for this. in index.js we need to add AppsV1Api client to make website deployment with replicas 1, image- nginx:alpine ( lightweight), open containerPort: 80, volumeMounts for `website-content`at Nginx's default html serving path mountPath `/usr/share/nginx/html` and volume pointing to `example-site-html`.
- after above deployment, we now create service to connect to deployed html served by Nginx.

- Again, re-build image, import and rollout restart deployment/dummysite-controller in default namespace:

```sh
docker build -t dummysite-controller:dev ./ex_5.1/controller
```

- load image into k3d:

```sh
k3d image import dummysite-controller:dev -c k3s-default
```

```sh
kubectl rollout restart deployment/dummysite-controller -n default
```

- check configmap, deployments and services:

```sh
kubectl get configmap,deployments,services -n default
```

```table
NAME                          DATA   AGE
configmap/example-site-html   1      63m
configmap/kube-root-ca.crt    1      66d
configmap/todo-app-config     3      21d

NAME                                   READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/dummysite-controller   1/1     1            1           19h
deployment.apps/example-site-web       1/1     1            1           84s

NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/example-site-svc   ClusterIP   10.43.220.125   <none>        80/TCP    84s
service/kubernetes         ClusterIP   10.43.0.1       <none>        443/TCP   66d
```

- Nginx Deployment (deployment.apps/example-site-web) is 1/1 READY. This means Kubernetes successfully started the container.
- get nginx pod:

```sh
kubectl get pods -n default -l app=example-site-web
```

```table
NAME                               READY   STATUS    RESTARTS   AGE
example-site-web-5976c88cc-8mmdh   1/1     Running   0          4m9s
```

- portforward the frontend nginx site:

```sh
kubectl port-forward service/example-site-svc 8080:80
```

- at http://localhost:8080/, i can see exactly the same English contents as in live https://example.com site:
  `
`This domain is for use in documentation examples without needing permission. This is not a service; avoid relying on it for testing and monitoring purposes.`
