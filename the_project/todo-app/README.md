# to_do app - the project: step-1

- create a simple native http server with nodejs and provided process.env.PORT and default 3000 port to run.
- create Dockerfile with node: 18-alpine image.
- create deployment.yaml for kubernetes deployment along with providing PORT 8080 for kubernetes setting inside container

# create docker image - 'todo-app:1.0':

`docker build -t todo-app:1.0 .`

# import docker image into k3d:

`k3d image import todo-app:1.0`

# apply deploy to cluster:

`kubectl apply -f manifests/deployment.yaml`

# check pods

`kubectl get pods`

- todo-app-78b8775577-nkfcw 1/1 Running 0 39s

# check logs:

`kubectl logs todo-app-78b8775577-nkfcw`

- Server started in port 8080
