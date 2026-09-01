# 2.1. Connecting pods

- created index.js server with /pingpong that increases counter and /pong that returns the current count
- tested locally
- created Dockerfile

## build docker image:

```sh
docker build -t ping_pong:ex-2.1 ./ex_2.1/ping_pong
```

## import image into k3d:

```bash
k3d image import ping_pong:ex-2.1 -c k3s-default
```

## create deployment and apply:

```bash
kubectl apply -f ex_2.1/ping_pong/manifests/deployment.yaml
```

## test /pings and /pingpong inside pod:

```sh
kubectl exec -it ping-pong-deploy-5944d97f57-5x4gp -- wget -qO- http://localhost:3000/pingpong
```

```sh
kubectl exec -it ping-pong-deploy-5944d97f57-5x4gp -- wget -qO- http://localhost:3000/pings
```

## create service and apply:

```bash
kubectl apply -f ex_2.1/ping_pong/manifests/service.yaml
```

## check ping-pong-svc and endpoints:

```sh
kubectl get svc ping-pong-svc
```

```sh
kubectl get endpoints ping-pong-svc
```

- ping-pong-svc 10.42.0.42:3000 82s

# test the endpoint via busybox, apply busybox for deployment:

```sh
kubectl apply -f ex_2.1/ping_pong/manifests/busybox-test-pod.yaml

```

## test DNS

```bash
kubectl exec -it my-busybox -- wget -qO- http://ping-pong-svc:3000/pings
```

## add log_output/index.js which fetches endpoint: http://ping-pong-svc:3000/pings

# build docker image for log output:

```sh
docker build -t log-output:ex-2.1 ./ex_2.1/log_output
```

- check image:

```sh
docker images | grep log-output
```

## import logoutput image into k3d:

```bash
k3d image import log-output:ex-2.1 -c k3s-default
```

# create deployment for logoutput and apply:

```sh
kubectl apply -f ex_2.1/log_output/manifests/deployment.yaml

```

### test communication with pods, from log output pod accessing to pingpong pod:

```sh
kubectl exec -it log-output-6b5c4d9fc8-wfzmm -- wget -qO- http://ping-pong-svc:3000/pings
```

### test logs output itself:

```sh
kubectl exec -it log-output-6b5c4d9fc8-wfzmm -- wget -qO- http://localhost:3000
```

### create service and ingress and apply them:

```sh
kubectl apply -f ex_2.1/log_output/manifests/service.yaml

```

```sh
kubectl apply -f ex_2.1/log_output/manifests/ingress.yaml

```

# check both urls work:

http://localhost:8081/ and http://localhost:8081/pingpong
