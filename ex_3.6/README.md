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

- cluster created, nodes are ready. Now, I commit to github and check all integrity.
