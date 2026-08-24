# to_do app (1.6) - the project: step-4

- prepare k3d environment:
  - remove existing cluster as it is not mapping with port

    ```bash
    k3d cluster delete
    ```

  - re-create cluster with port mapped:

    ```bash
    k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2
    ```

    - check new cluster:

    ```bash
    k3d cluster list
    ```

        k3s-default   1/1       2/2      true

# create docker image - 'todo-app:ex-1.6':

```bash
docker build -t todo-app:ex-1.6 ./the_project/todo-app
```

# import docker image into k3d:

```bash
k3d image import todo-app:ex-1.6
```

# check k3d cluster is running:

```bash
k3d cluster list
```

# change image in deployment.yaml: image: todo-app:ex-1.6

# apply deploy to cluster:

```bash
kubectl apply -f ./the_project/todo-app/manifests/deployment.yaml
```

# check pods

`kubectl get pods` : in fact there are other pods also with the same name so to avoid logging the wrong pod, I pick the name from medatadata: name: todo-app.

- todo-app-94b98d447-gvmw6 1/1 Running 0 18s

# let kubernetes select the appropriate Pod belonging to the Deployment

```bash
kubectl logs deployment/todo-app
```

- Server started in port 8080

# create NodePort Service, i.e. prepare service.yaml inside manifests file.

# apply service to cluster:

```bash
kubectl apply -f ./the_project/todo-app/manifests/service.yaml
```

# check services

```bash
kubectl get services
```

    - kubernetes ClusterIP 10.43.0.1 <none> 443/TCP 23m
    - todo-app-svc NodePort 10.43.142.50 <none> 8080:30080/TCP 46s

- I can see the HTML site:
  http://localhost:8082/
