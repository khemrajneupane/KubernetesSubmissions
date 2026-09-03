# 2.6. The project, step 10

- rest of the resource creations remain the same as done in [ex_2.4](https://github.com/khemrajneupane/KubernetesSubmissions/blob/2.4/ex_2.4/README.md) hence, the original READMD contents are available in the lower part of this page.

- additionally, I will add configmap.yaml inside project namespace ( to continue where this ex was done earier ), add necessary data and in the deployment container I will use this env data.
- I will re-create docker images, import into k3d, apply deployments, services, ingress etc, again.

# create configmap.yaml for todo_app and apply:

```sh
kubectl apply -f ex_2.6/todo_app/manifests/configmap.yaml
```

- make todo_app/index.js receives env variables from configmap and create docker image:

```bash
docker build -t todo_app:todo_app_ex_2.6 ./ex_2.6/todo_app
```

# import image todo_app:todo_app_ex_2.6 into k3d:

```sh
k3d image import todo_app:todo_app_ex_2.6 -c k3s-default
```

- refactor todo_app/deployment.yaml to connect to configmap, new docker image `todo_app:todo_app_ex_2.6` and apply

```sh
kubectl apply -f ex_2.6/todo_app/manifests/deployment.yaml
```

# re-apply persistentvolumeclaim.yaml as I had deleted it earlier, however, pv is intact yet:

```sh
kubectl apply -f ex_2.6/storage/persistentvolumeclaim.yaml
```

- added PORT env in todo_backend also and apply:

```sh
kubectl apply -f ex_2.6/todo_backend/manifests/deployment.yaml
```

# lets check env variables insid todo-app:

```sh
kubectl exec -n project todo-app-85565df98f-ttgcg -- printenv | grep -E 'IMAGE_URL|TODO_BACKEND_URL|IMAGE_CACHE_TIME'
```

# apply ingress of todo_app also inside project namespace:

```sh
kubectl apply -f ex_2.6/todo_app/manifests/ingress.yaml
```

# I had deleted service.yaml form todo_app earlie, no need to re apply:

```sh
kubectl apply -f ex_2.6/todo_app/manifests/service.yaml
```

- while testing: http://localhost:8081/, i noticed that my previous log-output ingress was using '/' path. So temporarilly, I used port forwarding logic just to test if all the configmap related environments are being used correctly by the todo-app:

```sh
kubectl -n project port-forward svc/todo-app-svc 3000:3000
```

- check todo-app: http://localhost:8081/
- works!!
