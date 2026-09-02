# 2.3. Keep them separated

- rest of the resource creations remain the same as done in [ex_2.1](https://github.com/khemrajneupane/KubernetesSubmissions/tree/2.1/ex_2.1) hence, the original READMD contents are available in the lower part of this page.
- all the .yaml files will add namespace: exercises esp. in resources' metadata object.
- I will re-create docker images, import into k3d, apply deployments, services, ingress etc, again.

## create namespace called exercises

```bash
kubectl create namespace exercises
```

- check namespaces:

```sh
kubectl get namespaces
```

# add exercises namespace in all services, deployment:

```sh
    metadata:
        name: log-output
        namespace: exercises
```

```sh
    metadata:
        name: log-output-svc
        namespace: exercises
```

```sh
    metadata:
        name: ping-pong-deploy
        namespace: exercises
```

```sh
    metadata:
        name: ping-pong-svc
        namespace: exercises
```

# Ex_2.3. Connecting pods

- created index.js server with /pingpong that increases counter and /pong that returns the current count
- tested locally
- created Dockerfile

## build docker image:

```sh
docker build -t ping_pong:ex-2.3 ./ex_2.3/ping_pong
```

## import image into k3d:

```bash
k3d image import ping_pong:ex-2.3 -c k3s-default
```

## create deployment and apply:

```bash
kubectl apply -f ex_2.3/ping_pong/manifests/deployment.yaml
```

- get pods in exercises namespace:

```sh
kubectl get pods -n exercises
```

- get deployment in exercises namespaces, since we added namespace exercise in deployment, services, ingress, now we can get them only by adding `-n exercises `:
- also executing inside pods needs adding `-n exercises` spacename:

```sh
kubectl get deployment -n exercises
```

## test /pings and /pingpong inside pod:

```sh
kubectl exec -n exercises -it ping-pong-deploy-6f8857b979-kfxl6 -- wget -qO- http://localhost:3000/pingpong
```

```sh
kubectl exec -n exercises -it ping-pong-deploy-6f8857b979-kfxl6 -- wget -qO- http://localhost:3000/pings
```

## create service and apply:

```bash
kubectl apply -f ex_2.3/ping_pong/manifests/service.yaml
```

## check ping-pong-svc and endpoints:

```sh
kubectl get svc ping-pong-svc -n exercises
```

```sh
kubectl get endpoints ping-pong-svc -n exercises
```

- ping-pong-svc 10.42.0.53:3000 82s

# test the endpoint via busybox, apply busybox for deployment:

```sh
kubectl apply -f ex_2.3/ping_pong/manifests/busybox-test-pod.yaml

```

## test DNS

```bash
kubectl exec -it my-busybox -- wget -qO- http://ping-pong-svc:3000/pings
```

## add log_output/index.js which fetches endpoint: http://ping-pong-svc:3000/pings

# build docker image for log output:

```sh
docker build -t log-output:ex-2.3 ./ex_2.3/log_output
```

- check image:

```sh
docker images | grep log-output
```

## import logoutput image into k3d:

```bash
k3d image import log-output:ex-2.3 -c k3s-default
```

# create deployment for logoutput and apply:

```sh
kubectl apply -f ex_2.3/log_output/manifests/deployment.yaml

```

### test communication with pods, from log output pod accessing to pingpong pod:

```sh
kubectl exec -n exercises -it log-output-7dc5b94c9b-h4g87 -- wget -qO- http://ping-pong-svc:3000/pings
```

### test logs output itself:

```sh
kubectl exec -n exercises -it log-output-7dc5b94c9b-h4g87 -- wget -qO- http://localhost:3000
```

### create service and ingress and apply them:

```sh
kubectl apply -f ex_2.3/log_output/manifests/service.yaml

```

```sh
kubectl apply -f ex_2.3/log_output/manifests/ingress.yaml

```

# check both urls work:

http://localhost:8081/ and http://localhost:8081/pingpong
