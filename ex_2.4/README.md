# 2.4. The project, step 9

- rest of the resource creations remain the same as done in [ex_2.4](https://github.com/khemrajneupane/KubernetesSubmissions/blob/2.2/ex_2.2/README.md) hence, the original READMD contents are available in the lower part of this page.
- all the .yaml files will add namespace: project esp. in resources' metadata object.
- I will re-create docker images, import into k3d, apply deployments, services, ingress etc, again.

## create namespace called project

```bash
kubectl create namespace project
```

- check namespaces:

```sh
kubectl get namespaces
```

# add project namespace in all services, deployment, storage etc.:

- since PV is clusterwise, so we don't add it to namespace: project but we do for PVC

```sh
    metadata:
        name: todo-app-pvc
        namespace: project
```

```sh
    metadata:
        name: todo-app
        namespace: project
```

```sh
    metadata:
        name: todo-app-ingress
        namespace: project
```

```sh
    metadata:
        name: todo-app-svc
        namespace: project
```

```sh
    metadata:
        name: todo-backend
        namespace: project
```

```sh
    metadata:
        name: todo-backend-svc
        namespace: project
```

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
docker build -t todo_backend:todo_backend_ex_2.4 ./ex_2.4/todo_backend
```

```bash
docker build -t todo_app:todo_app_ex_2.4 ./ex_2.4/todo_app
```

# run and test image locally:

```sh
docker run --rm -p 3000:3000 todo_app:todo_app_ex_2.4
```

# import both images into k3d:

```bash
k3d image import todo_backend:todo_backend_ex_2.4 -c k3s-default
```

```bash
k3d image import todo_app:todo_app_ex_2.4 -c k3s-default
```

# create persistentvolume.yaml, persistentvolumeclaim.yaml and apply:

```sh
kubectl apply -f ex_2.4/storage/persistentvolume.yaml
```

```sh
kubectl apply -f ex_2.4/storage/persistentvolumeclaim.yaml
```

# create deployment, service and ingress for todo_app:

```sh
kubectl apply -f ex_2.4/todo_app/manifests/deployment.yaml
```

```sh
kubectl apply -f ex_2.4/todo_app/manifests/service.yaml
```

```sh
kubectl apply -f ex_2.4/todo_app/manifests/ingress.yaml
```

## create only deployment and service for app_backend:

- as the frontend or todo-app can directly/internally talk to todo_backend, we don't need ingress.

# create deployment and service for todo_backend:

```sh
kubectl apply -f ex_2.4/todo_backend/manifests/deployment.yaml
```

```sh
kubectl apply -f ex_2.4/todo_backend/manifests/service.yaml
```

# make sure kubectl todo-backend-svc is correct and todo_app should use the same endpoing:

```bash
kubectl get endpoints todo-backend-svc -n project
```

- todo-backend-svc 10.42.1.22:3001 99s

# test backend through todo_app:

```sh
kubectl exec -n project -it todo-app-7bbbcdc6c9-d5qzv -- wget -qO- http://todo-backend-svc:3001/todos
```

- check todo-app: http://localhost:8081/
