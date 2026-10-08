## 4.2. The project, step 21

- lets initialize `let isHealthy = true` value as suggested in the exercise, and later we will make it toggable with a button in todo_app (frontend) via a new endpoint api in the backend.
- we create api route at: "/healthz" in todo backend which returns status 500, unhealthy if !isHealthy else it tries to test db with SELECT 1 and sends response 200, ok and catches any error.

### build image for backend:

```sh
docker build -t khemrajneupane/todo_backend:ex-4.2 ./ex_4.2/todo_backend
```

- import image into k3d:

```sh
k3d image import khemrajneupane/todo_backend:ex-4.2 -c k3s-default
```

- check yaml status with kustomization:

```sh
kubectl kustomize ex_4.2/todo_backend
```

- looks good with image names changes, storageClassName to local-path etc.
- lets apply kustomization:

```sh
kubectl apply -k ex_4.2/todo_backend
```

- we can execute wget inside todo-backend ( check: `kubectl get pods`) and hit /healthz endpoing:

```sh
kubectl exec -it todo-backend-75444fd45-ndfbm -- wget -qO- http://localhost:3001/healthz
```

- above gives status ok.

### add readiness probe in backend deployment.yaml:

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

- apply again:

```sh
kubectl apply -k ex_4.2/todo_backend
```

```sh
kubctl get pods
```

```table
NAME                            READY   STATUS    RESTARTS   AGE
todo-backend-799b69855b-zwr2d   1/1     Running   0          47s
todo-postgres-0                 1/1     Running   0          26m
```

- we see readiness is ok.
- readiness failure does not restart the container

### add livenessProbe also and redeploy:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

```sh
kubectl apply -k ex_4.2/todo_backend
```

```sh
kubectl get pods
```

```table
NAME                            READY   STATUS    RESTARTS   AGE
todo-backend-5786c67bff-kzbmp   0/1     Running   0          3s
todo-backend-799b69855b-zwr2d   1/1     Running   0          5m55s
todo-postgres-0                 1/1     Running   0          31m
```

- now we get todo-backend in rolling update and readiness has not passed yet because the deployment only happened 3s ago, we wait and get pods again:

```table
NAME                            READY   STATUS    RESTARTS   AGE
todo-backend-5786c67bff-kzbmp   1/1     Running   0          4m21s
todo-postgres-0                 1/1     Running   0          35m
```

- after delay we get all containers in ready state.
- until now the livenessprobe is added and Kubernetes is performing it, but its restart behavior has not yet been tested, yet.
- next, we intentionally break the backend by setting isHealthy = false and observe whether the liveness probe causes Kubernetes to restart the container.

- we add one /break endpoing in backend index.js which will basically toggle isHealthy to false:

```js
app.post("/break", (req, res) => {
  isHealthy = false;
  ...
```

- since we have changes in index.js in todo_backend, it is time to create docker image again:

### build image for backend:

```sh
docker build -t khemrajneupane/todo_backend:ex-4.2 ./ex_4.2/todo_backend
```

- import image into k3d:

```sh
k3d image import khemrajneupane/todo_backend:ex-4.2 -c k3s-default
```

- lets replace the currently running pod with a fresh pod by restarting deployment to use new image:

```sh
kubectl rollout restart deployment todo-backend
```

- make sure pods are healthy especially the new pod which we rollout restart above:

```sh
kubectl get pods
```

```table
NAME                            READY   STATUS    RESTARTS   AGE
todo-backend-66f47d7864-q97xr   1/1     Running   0          93s
todo-postgres-0                 1/1     Running   0          4h10m
```

- verify /healthz again:

```sh
kubectl exec -it todo-backend-66f47d7864-q97xr -- wget -qO- http://localhost:3001/healthz
```

- it is healthy: `{"status":"ok"}`
- the backend is running and responding because pod accepted an http request on port 3001
- isHealthy is currently true otherwise it would return 500
- backend reaches PostgreSQL
- we can describe pod and see its Events for knowing the status of readiness and liveness:

```sh
kubectl describe pod todo-backend-66f47d7864-q97xr
```

### i will deliverately break the backend by hitting /break endpoing:

- before hitting /break, i leave first terminal in watch mode to see live restarting pod

```sh
kubectl get pods -w
```

- in second terminal lets break the backend hitting /break endpoint:

```sh
kubectl exec -it todo-backend-66f47d7864-q97xr -- wget -qO- --post-data='' http://localhost:3001/break
```

- i got `{"status":"broken"}`
- then in the first terminal:

```table
NAME                            READY   STATUS    RESTARTS        AGE
todo-backend-66f47d7864-q97xr   1/1     Running   3 (3m37s ago)   28m
todo-postgres-0                 1/1     Running   0               4h37m
todo-backend-66f47d7864-q97xr   0/1     Running   3 (4m38s ago)   29m
todo-backend-66f47d7864-q97xr   0/1     Running   4 (1s ago)      30m
todo-backend-66f47d7864-q97xr   1/1     Running   4 (7s ago)      30m
```

- initially, the `todo-backend-66f47d7864-q97xr` Pod was in `1/1` state because `isHealthy` was `true`.
- after hitting `/break`, `isHealthy` became `false`.
- because `/healthz` started returning `500`, the readiness probe failed and the Pod became `0/1`. The container was still running at this point.
- after the liveness probe also failed several times, Kubernetes restarted the container. The restart count changed from `3` to `4`.
- after the restart, the application needed some time to become Ready again, so it was temporarily `0/1`.
- once `/healthz` returned successfully again, the Pod became `1/1`.
- until now, we have basically covered the main need of the exercise, but we need to implement frontend button that calls /break endpoint and show system erro contents in the site.

### add the /break call logic in todo_app/index.js and create image, change images in deployment/kustomization.yaml, import apply test.

- after adding required features in index.js, lets now build image:

```sh
docker build -t khemrajneupane/todo_app:ex-4.2 ./ex_4.2/todo_app
```

- import to k3d:

```sh
k3d image import khemrajneupane/todo_app:ex-4.2 -c k3s-default
```

- after image import, lets apply kustomization for todo_app:
- I cleaned up the resources which were created in default namespace, but later re-created all in `project` namespace.

```sh
kubectl apply -k ex_4.2
```

```sh
kubectl get pods -n project
```

- fresh deployment gives this:

```table
NAME                            READY   STATUS    RESTARTS   AGE
todo-app-54b88d944-x6q64        1/1     Running   0          25s
todo-backend-5786c67bff-f7cl5   1/1     Running   0          25s
todo-postgres-0                 1/1     Running   0          25s
```

- lets create todos table also:

```sh
kubectl exec -it todo-postgres-0 -n project -- \
  psql -U postgres -d postgres \
  -c "CREATE TABLE todos (id SERIAL PRIMARY KEY, todo TEXT NOT NULL);"
```

- now, lets port forward to get the frontend:

```sh
kubectl port-forward -n project svc/todo-app-svc 3000:3000
```

- frontend is visible/running at: `http://localhost:3000/`
- then in terminal I get pods in watch mode to view the live changes:

```sh
kubectl get pods -n project -w
```

- then I click the Break App button there: `http://localhost:3000/`
- watching the changes

```table
NAME                            READY   STATUS    RESTARTS   AGE
todo-app-54b88d944-x6q64        1/1     Running   0          15m
todo-backend-5786c67bff-f7cl5   1/1     Running   0          15m
todo-postgres-0                 1/1     Running   0          15m
todo-backend-5786c67bff-f7cl5   0/1     Running   0          23m
todo-backend-5786c67bff-f7cl5   0/1     Running   1 (1s ago)   23m
todo-backend-5786c67bff-f7cl5   1/1     Running   1 (7s ago)   23m
```

- initially, the todo-backend Pod was 1/1 Running, meaning the container was running and the readiness probe was successful.
- when the Break App button was clicked, isHealthy became false, causing /healthz to return HTTP 500.
- the readiness probe failed, so the Pod changed to 0/1. However, the container itself was still Running.
- after the liveness probe also failed repeatedly, Kubernetes restarted the container. The restart count increased from 0 to 1.
- the Pod name remained the same because Kubernetes restarted the container inside the existing Pod rather than creating a new Pod.
- when the Node.js process restarted, let isHealthy = true was initialized again.
- the /healthz endpoint therefore started returning successfully again, the readiness probe passed, and the Pod returned to 1/1 Running.
- during the unhealthy period, the frontend displayed:`System Failure. The todo app is currently unhealthy. Please wait for recovery`
- after the backend container restarted and became Ready again, the frontend recovered and worked normally.

# Hence, everything is tested !!
