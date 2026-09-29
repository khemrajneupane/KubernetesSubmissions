## 3.7. The project, step 16

- this project builds entirely on [previous 3.6](https://github.com/khemrajneupane/KubernetesSubmissions/tree/3.6/ex_3.6), so most of the resource creation and authorization, authetication remain as it is.
- we will not create namespace in the previous way but dynamically based on branch. So, GitHub action will create namespace not our yaml this time.
- remove resource `- manifests/namespace.yaml` from kustomization.yaml
- remove existing hard-coded `namespace: project` from all resources in manifests/\*
- we edit workflow main.yml file to add dynamic namespace basd on branch name, in there we introduce NAMESPACE variable while doing namespace calculation condition: `NAMESPACE: ${{ github.ref_name }}`
- we also need to make condition that if the branch (${{ github.ref_name }}) is 'main' then default to 'project' namespace else create branch-name as namespace.

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

- verify the new cluster's node needs permission to pull images from Artifact Registry still exists.

```sh
gcloud projects get-iam-policy dwk-gke-507811 \
  --flatten="bindings[].members" \
  --filter="bindings.members:473141739822-compute@developer.gserviceaccount.com AND bindings.role:roles/artifactregistry.reader" \
  --format="table(bindings.role)"
```

- with the above command i can see reader permission to registry: `roles/artifactregistry.reader``
- git push to `main` and test then git push to `feature-tod`and test.
- github workflow passes on main branch
- check all resources in 'project' namespace as we pushed to 'main' branch the 'project' namespace should be created or used by default:

```sh
kubectl get all -n project
```

- I get:

```table
NAME                                READY   STATUS    RESTARTS   AGE
pod/todo-app-6488fccfd-rpd9s        1/1     Running   0          96s
pod/todo-backend-56b8f99cb9-kp6jd   1/1     Running   0          95s
pod/todo-postgres-0                 1/1     Running   0          95s

NAME                        TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)          AGE
service/todo-app-svc        LoadBalancer   34.118.233.189   35.228.126.239   3000:31799/TCP   97s
service/todo-backend-svc    ClusterIP      34.118.233.98    <none>           3001/TCP         97s
service/todo-postgres-svc   ClusterIP      34.118.236.14    <none>           5432/TCP         96s

NAME                           READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/todo-app       1/1     1            1           96s
deployment.apps/todo-backend   1/1     1            1           95s

NAME                                      DESIRED   CURRENT   READY   AGE
replicaset.apps/todo-app-6488fccfd        1         1         1       96s
replicaset.apps/todo-backend-56b8f99cb9   1         1         1       95s

NAME                             READY   AGE
statefulset.apps/todo-postgres   1/1     95s

NAME                           SCHEDULE    TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/todo-generator   0 * * * *   <none>     False     0        <none>          94s
```

- verifying if images are actualy from artifact registry:

```sh
kubectl get deployments -n project \
  -o jsonpath='{range .items[*]}{.metadata.name}{" -> "}{.spec.template.spec.containers[0].image}{"\n"}{end}'
```

`todo-app -> europe-north1-docker.pkg.dev/dwk-gke-507811/my-repository/`

`todo-app:main-e32048bcd3514bfd1d4b79e70679eddc6ff3372a`

`todo-backend -> europe-north1-docker.pkg.dev/dwk-gke-507811/my-repository/`

`todo-backend:main-e32048bcd3514bfd1d4b79e70679eddc6ff3372a`

- at this point the frontend at: `http://35.228.126.239:3000/`showed `Failed to load Todo App`and it is caused by postgres todo table not existing.
- I am creating a postgres table and test.

```sh
kubectl exec -it todo-postgres-0 -n project -- \
  psql -U postgres -c "CREATE TABLE todos (id SERIAL PRIMARY KEY, todo TEXT NOT NULL);"
```

- Now I can verify that the frontend is coming up and post a todo is working but wiki links are not showing up to so i am manually creating a one job

```sh
kubectl create job \
  --from=cronjob/todo-generator \
  todo-generator-test \
  -n project
```

- verify new job is working:

```sh
kubectl get jobs -n project
```

```table
NAME                  STATUS     COMPLETIONS   DURATION   AGE
todo-generator-test   Complete   1/1           6s         7s
```

- and the wiki Read links also show up so i can remove the temp test job:

```sh
kubectl delete job todo-generator-test -n project
```

- I checked out to `feature-todo`branch and pushed
- verify namespace `feature-todo`exists with all resources:

```sh
kubectl get all -n feature-todo
```

```table
NAME                        TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)          AGE
service/todo-app-svc        LoadBalancer   34.118.236.181   35.228.205.211   3000:30603/TCP   4m12s
service/todo-backend-svc    ClusterIP      34.118.237.89    <none>           3001/TCP         4m12s
service/todo-postgres-svc   ClusterIP      34.118.234.137   <none>           5432/TCP         4m11s

NAME                           READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/todo-app       1/1     1            1           4m10s
deployment.apps/todo-backend   1/1     1            1           4m10s

NAME                                      DESIRED   CURRENT   READY   AGE
replicaset.apps/todo-app-dc55c8f44        1         1         1       4m10s
replicaset.apps/todo-backend-6db58889b7   1         1         1       4m10s

NAME                             READY   AGE
statefulset.apps/todo-postgres   1/1     4m10s

NAME                           SCHEDULE    TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/todo-generator   0 * * * *   <none>     False     1        2m50s           4m10s

NAME                                STATUS    COMPLETIONS   DURATION   AGE
job.batch/todo-generator-29844840   Running   0/1           2m50s      2m50s
```

- I can access the frontend and all resources are up and running.
- `http://35.228.205.211:3000/``
- All works!!!
