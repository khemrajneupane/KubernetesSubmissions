## 4.8. The project, step 24

- create a dedicated file `todo-app-application.yaml` and add configurations, which will ultimately point to the root `kustomization.yaml`.

### apply argocd config:

```sh
kubectl apply -f ex_4.8/argocd/todo-app-application.yaml
```

- check application status:

```sh
kubectl get applications -n argocd
```

```table
NAME         SYNC STATUS   HEALTH STATUS
log-output   Synced        Healthy
todo-app     Unknown       Healthy
```

- Push to github for the first test.
- check Argo CD applications:

```sh
kubectl get applications -n argocd
```

- I made some harmless changes in the todo_app/manifests/deployment.yaml to commit to GitHub and test if Argo CD synch that changes into the cluster.
