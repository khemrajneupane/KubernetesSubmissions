## 3.5. The project, step 14

- add customization.yaml file in the todo_backend root
- add all resrouces
- combine all manifests into one final Kubernetes config and verify it dumps all resulting yaml and shows in one place:

```sh
kubectl kustomize .
```

- add image connections, the image to run in container is mapped with name and image keys in kustomization spec

```yaml
images:
  - name: TODO/IMAGE
    newName: khemrajneupane/todo_backend
    newTag: ex-3.5
```

- In my case, however, the above image is not existing in the dockerhub so, I create it:

```sh
docker build -t khemrajneupane/todo_backend:ex-3.5 ./ex_3.5/todo_backend
```

- then push image to dockerhub:

```sh
docker push khemrajneupane/todo_backend:ex-3.5
```

- create cluster in GC again as previous was deleted:

```sh
gcloud container clusters create dwk-cluster \
  --zone=europe-north1-b \
  --cluster-version=1.36 \
  --disk-size=32 \
  --num-nodes=1 \
  --machine-type=e2-small
```

- check if there is connection to new cluster if pods exist:

```sh
kubectl get nodes
```

- create namespace yaml file and add to kustomization, now namespace become part of deployable application configuration. So, we don't need to remember to crate it even if we forget.
- dry run for making sure config files have all the necessary changes

```sh
kubectl kustomize .
```

- for the todo_app part, we can add one more persistent volume claim yaml as pvc.yaml

- the todo_app is not yet having public image in dockerhub, so let me create and push to hub:

```sh
docker build -t khemrajneupane/todo_app:ex-3.5 ./ex_3.5/todo_app
```

- then push image to dockerhub:

```sh
docker push khemrajneupane/todo_app:ex-3.5
```

- there is still todo_generator, so build image and push to dockerhub:

```sh
docker build -t khemrajneupane/todo_generator:ex-3.5 ./ex_3.5/todo_generator
```

```sh
docker push khemrajneupane/todo_generator:ex-3.5
```

- at this point images are created and added to respective kustomization.yaml and deployment.yaml.
- I added kustomization.yaml both inside todo_app (frontend) and todo_backend and again created combined kustomization.yaml in the root ex_3.5 and added both todo_app and todo_backend along with namespace creation.
- also added value to be: `/var/lib/postgresql/data/pgdata` and mountPath to be:`/var/lib/postgresql/data` in postgres.yaml

## apply the kustomization:

```sh
kubectl apply -k .
```

- the result logs:

```table
namespace/project created
configmap/todo-app-config created
secret/todo-backend-secret created
service/todo-app-svc created
service/todo-backend-svc created
service/todo-postgres-svc created
persistentvolumeclaim/todo-app-pvc created
deployment.apps/todo-app created
deployment.apps/todo-backend created
statefulset.apps/todo-postgres created
```

### all resources are created but database needs table creation and insertion first:

```sh
kubectl exec -it todo-postgres-0 -n project -- psql -U postgres
```

- then create table:

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    todo TEXT NOT NULL
);
```

- temporary testing by port-forwarding:

```sh
kubectl port-forward -n project svc/todo-app-svc 3000:3000
```

- then the contents appear in the site and adding new to-do also works! `http://localhost:3000/`

- again, temporarilly i used LoadBalancer type in todo_app service to get External-ip to test it in live:

```sh
kubectl get svc todo-app-svc -n project
```

```table
NAME           TYPE           CLUSTER-IP      EXTERNAL-IP    PORT(S)          AGE
todo-app-svc   LoadBalancer   34.118.232.62   34.88.66.246   3000:30911/TCP   87m
```

- test at: `http://34.88.66.246:3000/`
- It works!!

### Delete cluster, save credits:

```sh
gcloud container clusters delete dwk-cluster \
--zone europe-north1-b
```
