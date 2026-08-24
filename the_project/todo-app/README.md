# to_do app (1.4) - the project: step-2

- create a simple native http server with nodejs and provided process.env.PORT and default 3000 port to run.
- create Dockerfile with node: 18-alpine image.
- create deployment.yaml for kubernetes deployment along with providing PORT 8080 for kubernetes setting inside container

# create docker image - 'todo-app:ex-1.4':

`docker build -t todo-app:ex-1.4 ./the_project/todo-app`

# import docker image into k3d:

`k3d image import todo-app:ex-1.4`

# apply deploy to cluster:

`kubectl apply -f ./the_project/todo-app/manifests/deployment.yaml`

# check pods

`kubectl get pods`

- todo-app-578f64b977-r928n 1/1 Running 0 39s

# check logs:

`kubectl logs todo-app-578f64b977-r928n`

- Server started in port 8080
