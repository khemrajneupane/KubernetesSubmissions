# to_do app (1.5) - the project: step-3

- create a simple native http server with nodejs and provided process.env.PORT and default 3000 port to run.
- GET request is sent to /url and it sends a response of a simple Todo App Step3, Ex-1.5 HTML contents.
- create Dockerfile with node: 18-alpine image, as before.
- create deployment.yaml, as before.

# create docker image - 'todo-app:ex-1.5':

`docker build -t todo-app:ex-1.5 ./the_project/todo-app`

# import docker image into k3d:

`k3d image import todo-app:ex-1.5`

# check k3d cluster is running:

```bash
k3d cluster list
```

# apply deploy to cluster:

`kubectl apply -f ./the_project/todo-app/manifests/deployment.yaml`

# check pods

`kubectl get pods` : in fact there are other pods also with the same name so to avoid logging the wrong pod, I pick the name from medatadata: name: todo-app.

- log-output-5cb75db87b-vftw9 1/1 Running 0 18h
- todo-app-55f77c8484-wm9z4 1/1 Running 0 16s
- todo-app-578f64b977-r928n 1/1 Terminating 0 5h24m

# let kubernetes select the appropriate Pod belonging to the Deployment

```bash
kubectl logs deployment/todo-app
```

- Server started in port 8080

# port-forward so that the server is open to internet.

```bash
kubectl port-forward deployment/todo-app 8080:8080
```

- I can access the html page at: http://localhost:8080/
