## 3.6. The project, step 15

- used type: Recreate in the todo_app deployment so that when

### creating artifacts repository:

```sh
gcloud artifacts repositories create my-repository \
  --repository-format=docker \
  --location=europe-north1 \
  --description="Docker repository for DevOps with Kubernetes"
```

- then GitHub Actions need permission to use GC
- create the `service account` which is the identity GitHub Actions will use to interact with Google Cloud:

### service account:

```sh
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions SA"
```

- GitHub workflow needs to push Docker images into `my-repository`which we created earlier. So, lets grand the service account permision to write Docker images to Artifact Registry:

```sh
gcloud projects add-iam-policy-binding dwk-gke-507811 \
  --role="roles/artifactregistry.writer" \
  --member="serviceAccount:github-actions-sa@dwk-gke-507811.iam.gserviceaccount.com"
```

- grant permission to deploy to GKE:

```sh
gcloud projects add-iam-policy-binding dwk-gke-507811 \
  --role="roles/container.admin" \
  --member="serviceAccount:github-actions-sa@dwk-gke-507811.iam.gserviceaccount.com"
```

- This gives the GKE node permission to pull images from Artifact Registry:

```sh
gcloud projects add-iam-policy-binding dwk-gke-507811 \
  --member="serviceAccount:473141739822-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

- then we can check and verify that my account gets permission to pull images from Artifact Registry:

```sh
gcloud projects get-iam-policy dwk-gke-507811 \
  --flatten="bindings[].members" \
  --filter="bindings.members:473141739822-compute@developer.gserviceaccount.com AND bindings.role:roles/artifactregistry.reader" \
  --format="table(bindings.role)"
```

- create workload identity pool to allow Google cloud to accept GitHub:

### workload identify pool:

```sh
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### create Github OIDC provider:

```sh
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='khemrajneupane/KubernetesSubmissions'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

- Allow GitHub repo to impersonate the service account:

```sh
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-sa@dwk-gke-507811.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/473141739822/locations/global/workloadIdentityPools/github-pool/attribute.repository/khemrajneupane/KubernetesSubmissions"
```

- add github wrokflow release
- check the all the generated codes so far with kustomize

```sh
kubectl kustomize .
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

- cluster created, nodes are ready. Now, I commit to github and check all integrity.
- we still need to create todos table in postgres:

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    todo TEXT NOT NULL
);
```

- since we have hourly running cronjob, lets test it immediately by creating immediate job now:

```sh
kubectl create job \
  --from=cronjob/todo-generator \
  todo-generator-test \
  -n project
```

- then verify the generator inserted a row in todos:

```sh
kubectl exec -it todo-postgres-0 -n project -- \
psql -U postgres -c "SELECT * FROM todos ORDER BY id DESC LIMIT 5;"
```

- I removed the job and just kept cronjob resource in the todo_generator
- finally, i can get todo-app service's external ip to test the todo-app:

```sh
kubectl get service todo-app-svc -n project
```

```table
NAME           TYPE           CLUSTER-IP       EXTERNAL-IP     PORT(S)          AGE
todo-app-svc   LoadBalancer   34.118.234.181   34.88.155.239   3000:31949/TCP   80m
```

- I tested the app, it shows wikipedia links and addign new todo also works persistently at:
  `http://34.88.155.239:3000/`
- Everything works!!!
