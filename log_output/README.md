# Log Output- External access with Ingress (1.7)

- refactor index.js so that random is generated once, timestamp in 5000ms added.
- test the index.js locally first before creating image, node index.js

# build docker image:

```bash
docker build -t log-output:ex-1.7 ./log_output
```

# import the image into k3d:

```bash
k3d image import log-output:ex-1.7
```

# change image in deployment.yaml: image: todo-app:ex-1.7

- add env for PORT 3000 also in deployment.yaml

# apply deployment:

```bash
kubectl apply -f log_output/manifests/deployment.yaml
```

# check deployment:

```bash
kubectl get deployment
```

# create service.yaml:

- define ClusterIP, port and targetport 3000

# apply service:

```bash
kubectl apply -f log_output/manifests/service.yaml
```

# check the service is created with ClusterIp type ( not NodePort ) anymore:

- kubernetes ClusterIP 10.43.0.1 <none> 443/TCP 24h
- log-output-svc ClusterIP 10.43.249.29 <none> 2345/TCP 13s

# check the pod's IP and PORT:

```bash
kubectl get endpoints log-output-svc
```

- log-output-svc 10.42.1.7:3000 112s

# create ingress service with all the specs

# apply ingress:

```bash
kubectl apply -f log_output/manifests/ingress.yaml
```

# check ingress:

```bash
kubectl get ingress
```

- log-output-ingress traefik \* 172.18.0.3,172.18.0.4,172.18.0.5 80 47s

# check the backend is serving, ok:

- http://localhost:8081/
