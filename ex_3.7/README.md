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
