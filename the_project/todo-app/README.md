# to_do app (1.8) - the project: step-5

- delete ingress used in log_output task as required by this exercise

```bash
kubectl delete -f log_output/manifests/ingress.yaml
```

# build docker image:

```bash
docker build -t todo-app:ex-1.8 ./the_project/todo-app
```

# import the image into k3d:

```bash
k3d image import todo-app:ex-1.8
```

# apply deployment:

```bash
kubectl apply -f the_project/todo-app/manifests/deployment.yaml
```

# check deployment:

```bash
kubectl get deployment
```

# create service.yaml:

- define ClusterIP, port:2345 and targetPort: 3000

# apply service:

```bash
kubectl apply -f the_project/todo-app/manifests/service.yaml
```

# check the service is created with ClusterIp type ( not NodePort ) anymore:

```bash
kubectl get services
```

- todo-app-svc ClusterIP 10.43.68.28 <none> 2345/TCP 24s

# check the pod's IP and PORT:

```bash
kubectl get endpoints todo-app-svc
```

- todo-app-svc 10.42.1.8:3000 3m18s

# create ingress service with all the specs

# apply ingress:

```bash
kubectl apply -f the_project/todo-app/manifests/ingress.yaml
```

# check ingress:

```bash
kubectl get ingress
```

- todo-app-ingress traefik \* 172.18.0.3,172.18.0.4,172.18.0.5 80 13s

# check the backend is serving, ok:

- http://localhost:8081/
