# 1.9. More services ( pingpong ):

- create a separate dedicated folder pingpong and related sub-folders and files along with index.js, Dockerfile, README.md, manifests and its related files all inside log_output main folder.
- create index.js with counter initialized to 0 and increment on every request hit to /pingpong route. counter++
- prepare response as required.

# build docker image:

```bash
docker build -t ping-pong:ex-1.9 ./log_output/ping_pong
```

# import into k3d:

```bash
k3d image import ping-pong:ex-1.9
```

# create deployment and apply:

```bash
kubectl apply -f log_output/ping_pong/manifests/deployment.yaml
```

# create service.yaml and apply:

- define ClusterIP, port and targetport 3000

```bash
kubectl apply -f log_output/ping_pong/manifests/service.yaml
```

- check endpoints:

```bash
kubectl get endpoints ping-pong-svc
```

    NAME            ENDPOINTS        AGE
    ping-pong-svc   10.42.1.9:3000   48s

# in order for log_output app to access ping-pong services at '/pingpong' endpoint, add one more http path rule as /pingpong in the ingress.yaml of log_output

```
- path: /pingpong
pathType: Prefix
backend:
    service:
    name: ping-pong-svc
    port:
        number: 3000
```

# apply ingress.yaml of log_output:

```bash
kubectl apply -f log_output/manifests/ingress.yaml
```

# describe ingress log-output-ingress:

```bash
kubectl describe ingress log-output-ingress
```

- both / and /pingpong endpoints should be active.

```
Rules:
  Host        Path  Backends
  ----        ----  --------
  *
              /           log-output-svc:2345 ()
              /pingpong   ping-pong-svc:3000 (10.42.1.9:3000)
```

# check outputs:

- http://localhost:8081/ displays: 2026-08-26T10:22:46.288Z: a40d94a15690d21369668a692a41bdff
- http://localhost:8081/pingpong displays: pong 8 where 8 is an increasing number from 0, based on hit on /pingpong
