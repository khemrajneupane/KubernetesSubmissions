# Ex_5.6. Trying serverless

- i will create a separate cluster with traefik disabled, adding specified version and also naming it `knative-cluster`:

```sh
k3d cluster create knative-cluster --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2 --k3s-arg "--disable=traefik@server:0" --image rancher/k3s:v1.34.1-k3s1
```

- verify current-context is `k3d-knative-cluster` and agents are servers belong to this cluser:

```sh
kubectl config current-context
kubectl get nodes
```

- current context: `k3d-knative-cluster` and nodes:

```table
NAME                           STATUS   ROLES           AGE   VERSION
k3d-knative-cluster-agent-0    Ready    <none>          38s   v1.34.1+k3s1
k3d-knative-cluster-agent-1    Ready    <none>          38s   v1.34.1+k3s1
k3d-knative-cluster-server-0   Ready    control-plane   44s   v1.34.1+k3s1
```

- now install knative's required CRDs compatible v1.23.0:

```sh
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-crds.yaml
```

- Install the core components of Knative Serving compatible v1.23.0:

```sh
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-core.yaml
```

- install Knative Kourier controller compatible v1.23.0:

```sh
kubectl apply -f https://github.com/knative/net-kourier/releases/download/knative-v1.23.0/kourier.yaml
```

- Configure Knative Serving to use Kourier:

```sh
kubectl patch configmap config-network \
  --namespace knative-serving \
  --type merge \
  --patch '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'
```

- Check Knative and Kourier health:

```sh
kubectl get pods -n knative-serving
kubectl get pods -n kourier-system
```

```table
NAME                                      READY   STATUS    RESTARTS   AGE
activator-56d698c974-8p952                1/1     Running   0          2m59s
autoscaler-69fcf466cb-469w2               1/1     Running   0          2m59s
controller-5857b6bf55-xvc66               1/1     Running   0          2m59s
net-kourier-controller-5d74dfdd6f-sp9zk   1/1     Running   0          2m32s
webhook-5cdb4c6879-2qxn5                  1/1     Running   0          2m59s

NAME                                      READY   STATUS    RESTARTS   AGE
3scale-kourier-gateway-6cd8b569b4-6jghz   1/1     Running   0          2m47s
```

- check the kubernetes services created by Kourier:

```sh
kubectl --namespace kourier-system get service kourier
```

```table
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP                        PORT(S)                      AGE
kourier   LoadBalancer   10.43.50.230   172.19.0.3,172.19.0.4,172.19.0.5   80:32674/TCP,443:30660/TCP   6m9s
```

- patch a config-domain to direct Knative to use the server IP `172.19.0.3`, this first IP belongs to Server node while others are for agent 1 and 2. Technically, we could use any one of them :

```sh
kubectl patch configmap config-domain \
  --namespace knative-serving \
  --type merge \
  --patch '{"data":{"172.19.0.3.sslip.io":""}}'
```

- verify configurations:

```sh
kubectl get configmap config-domain -n knative-serving -o yaml
```

- check kourier's service:

```sh
kubectl get svc kourier -n kourier-system
```

- all up to date.
- now deploy a simple test Knative Service (rather than Kubernetes Deployment) to check that the complete serverless setup works and apply:

```sh
kubectl apply -f hello-service.yaml
```

- check Knative Service:

```sh
kubectl get ksvc
```

- we see ready True and url: http://hello.default.172.19.0.3.sslip.io

```table
NAME    URL                                        LATESTCREATED   LATESTREADY   READY   REASON
hello   http://hello.default.172.19.0.3.sslip.io   hello-00001     hello-00001   True
```

- test the application:

```sh
curl -H "Host: hello.default.172.19.0.3.sslip.io" http://localhost:8081
```

- above shows the response `Hello Knative!`
