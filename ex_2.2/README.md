# 2.2. The project, step 8

- basically, this exercise builds on top of previous [ex_1.13](https://github.com/khemrajneupane/KubernetesSubmissions/blob/1.13/ex_1.13/README.md)

# create todo-backend

- todo_backend/index.js contains GET and POST at '/todos'
- temporarilly, we can add the todo lists on memory veriable
- test get / post both locally, first.

```sh
    curl http://localhost:3001/todos
```

```sh
    curl -X POST http://localhost:3001/todos \
    -H "Content-Type: application/json" \
    -d '{"todo":"Learn project step 8"}'
```

## refactor todo_backend/index.js:

- I will create service with this name: 'todo-backend-svc'
- then index.js can use "http://todo-backend-svc:3001" endpoint.

# build images for todo-app and todo-backend both:

```bash
docker build -t todo_backend:todo_backend_ex_2.2 ./ex_2.2/todo_backend
```

```bash
docker build -t todo_app:todo_app_ex_2.2 ./ex_2.2/todo_app
```

# run and test image locally:

```sh
docker run --rm -p 3000:3000 todo_app:todo_app_ex_2.2
```

# import both images into k3d:

```bash
k3d image import todo_backend:todo_backend_ex_2.2 -c k3s-default
```

```bash
k3d image import todo_app:todo_app_ex_2.2 -c k3s-default
```

# create persistentvolume.yaml, persistentvolumeclaim.yaml and apply:

```sh
kubectl apply -f ex_2.2/storage/persistentvolume.yaml
```

```sh
kubectl apply -f ex_2.2/storage/persistentvolumeclaim.yaml
```

# create deployment, service and ingress for todo_app:

```sh
kubectl apply -f ex_2.2/todo_app/manifests/deployment.yaml
```

```sh
kubectl apply -f ex_2.2/todo_app/manifests/service.yaml
```

```sh
kubectl apply -f ex_2.2/todo_app/manifests/ingress.yaml
```

## create only deployment and service for app_backend:

- as the frontend or todo-app can directly/internally talk to todo_backend, we don't need ingress.

# create deployment and service for todo_backend:

```sh
kubectl apply -f ex_2.2/todo_backend/manifests/deployment.yaml
```

```sh
kubectl apply -f ex_2.2/todo_backend/manifests/service.yaml
```

# make sure kubectl todo-backend-svc is correct and todo_app should use the same endpoing:

```bash
kubectl get endpoints todo-backend-svc
```

- todo-backend-svc 10.42.0.51:3001 99s
- we can access this svc as: http://todo-backend-svc:3001

# test backend through busybox pod or todo_app:

```sh
kubectl exec -it my-busybox -- wget -qO- http://todo-backend-svc:3001/todos
```

```sh
kubectl exec -it todo-app-7c5f7559f7-s2fxj -- wget -qO- http://todo-backend-svc:3001/todos
```

- check todo-app: http://localhost:8081/
