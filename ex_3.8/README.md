## 3.8. The project, step 17

- this exercise is done in branch `feature-todo` and later documented in `main``

- create delete-environment.yml in workflows that will have on delete to trigger
- Google cloud authentication, related environments,give kubectl access to the cluster, setup Cloud SDK, job to delete if github event ref type is 'branch'.
- the yml should also be safe or having safety rule before delete command so we add condition which namespace to not delete e.g. 'project' or main branch.

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

```sh
kubectl get namespaces
```

- now we have the namespace which gets created by running the github action on previous feature-todo branch. That also created all needed resources.
  `feature-todo                        Active   83s`

- I pushed commits to `feature-todo`branch and now going to delete it:

```sh
git push origin --delete feature-todo
```

- Delete environment workflow triggers on `feature-todo`branch deletion:

```table
Run kubectl delete namespace "$NAMESPACE"
namespace "feature-todo" deleted
```

- everything works!!

- finally delete cluster:

```sh
gcloud container clusters delete dwk-cluster \
  --zone europe-north1-b
```
