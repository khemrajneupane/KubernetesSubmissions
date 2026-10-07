## 3.11. The project, step 19

- the codes for this exercise are the same as ex_3.10, but we will only change manifests, e.g. deployment.
- Since todo_app and todo_backend are not changed, we will not need to change their docker images.
- again, this exercise is mainly about requests and limits so we will work on our local k3d cluster at first and if we deem necessary we will deploy to GKE cluster.

### check which cluster are in use right now:

```shell
kubectl config get-contexts
```

- we get gke context as:

```table
CURRENT   NAME              CLUSTER           AUTHINFO              NAMESPACE
          k3d-k3s-default   k3d-k3s-default   admin@k3d-k3s-default
```

- above, currrent context is missing, so we will switch to k3d local context:

```shell
kubectl config use-context k3d-k3s-default
```

- verify nodes are in local:

```sh
kubectl get nodes
```

- lets check and delete our existing `project` namespaces first and recreate a fresh.

```sh
kubectl top pods -n project
```

- delete:

```sh
kubectl delete namespace project
```

- infact, i remove my previously existing namespaces just I dont need my resource consumed now.

```sh
kubectl delete namespace monitoring
kubectl delete namespace exercises
```

- lets recreate `project` namespace for this exercise.

```sh
kubectl create namespace project
```

- add the namespace in the root kustomization.yaml file:

```yaml
namespace: project
```

- at this point lets dry run kustomization in the root directory:

```sh
kubectl kustomize .
```

- lets apply all resources:

```sh
kubectl apply -k .
```

- after apply, lets check the project namespace pods:

```sh
kubectl get pods -n project
```

- some pods are pending especially the postgres one as we had used `storageClassName: standard-rwo` for GKE but now we are in local k3d.
- we will remove storageClassName from both `todo_app/manifests/pvc.yaml` and `todo_backend/manifests/postgres.yaml` altogether, if we dont add any class it will use `default StorageClass` in local.
- lets also create todo table from postgres:

```sh
kubectl exec -it todo-postgres-0 -n project -- psql -U postgres
```

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    todo TEXT NOT NULL
);
```

- lets test the app is working first, lets add nodePort: 30080 to the app_todo/service.yaml and apply kustomize again.
- nodePort is needed because in GKE, the cloud infrastructure handles the external access for us automatically while locally, we have to connect the k3d port mapping to a NodePort ourselves.
- Now our apps are running, adding todo properly: `http://localhost:8082/`

- lets check cup and memory status:

```sh
kubectl top pods -n project
```

- the above status looks:

```table
NAME                            CPU(cores)   MEMORY(bytes)
todo-app-568cfc657f-qpz6w       1m           13Mi
todo-backend-544b88d588-rxzbf   0m           55Mi
todo-postgres-0                 1m           46Mi
```

- based on the above table, lets increase request for cup and memory and limits as well.
- Kubernetes resource requests and limits are configured per container. They are not automatically applied to the entire namespace. Therefore, we will configure appropriate requests and limits for each container individually as we go on.
- 1. for the todo-app the current usage was **1m CPU and 13Mi memory** according to `kubectl top pods` table above. We therefore set requests to **10m CPU and 32Mi memory** to provide enough room, and limits to **100m CPU and 64Mi memory** to allow temporary increases without giving the container excessive resources:

```yaml
resources:
  requests:
    cpu: 10m
    memory: 32Mi
  limits:
    cpu: 100m
    memory: 64Mi
```

- 2. for the todo-backend the current usage was **0m CPU and 55Mi memory** according to `kubectl top pods` table above. We therefore set requests to **10m CPU and 64Mi memory** to provide enough room, and limits to **100m CPU and 128Mi memory** to allow temporary increases in CPU and memory usage.

```yaml
resources:
  requests:
    cpu: 10m
    memory: 64Mi
  limits:
    cpu: 100m
    memory: 128Mi
```

- 3. likewise for todo-postgres. Since postgreSQL is the application's database, we allow more rooms than the other containers:

```yaml
resources:
  requests:
    cpu: 10m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

- likewise, for todo-generator CronJob, backeups etc., their memory accocation is not shown in `kubectl top pods -n project`, they are not our sensible resources to increase requests and limits for now.

- after those resources addition, lets apply them and check back if applied properly:

```sh
kubectl apply -k .
```

```sh
kubectl describe pod -n project -l app=todo-app
kubectl describe pod -n project todo-postgres-0
kubectl describe pod -n project -l app=todo-backend

```

- they are applied correctly, so we have given each conainers least memory and cup which and based on requests the maximum memory and cup will be used.

- everything works!
