## Ex_4.10. The project, the grande finale

- Created a new GitHub repository, [kubernetesSubmissions-configuration](https://github.com/khemrajneupane/kubernetesSubmissions-configuration/tree/4.10/ex_4.10), and cloned it locally.
- Copied the Exercise 4.9 files and folders into `ex_4.10`.
- Kept Kubernetes manifests, Kustomize files, overlays, storage configuration, and Argo CD Application files.
- Removed application source files, such as `index.js`, `package.json`, and `Dockerfile`, from the configuration repository.
- Updated both Argo CD Application files to use the new configuration repository, the `main` branch, and the correct staging and production overlay paths.
- Validated the staging and production configurations using `kubectl kustomize`.
- Next, commit and push the configuration repository, then update the live Argo CD Applications to use it.
- After github commit, update the existing staging and production applications:

```sh
kubectl apply -f ex_4.10/argocd/todo-staging-application.yaml -n argocd
kubectl apply -f ex_4.10/argocd/todo-production-application.yaml -n argocd
```

- checking in todo-staging and todo-production for conditions, events, sources, repoURL and path and are verified to be up to date with the latest commit:

```sh
kubectl describe application todo-staging -n argocd
kubectl describe application todo-production -n argocd
```

- both Applications were switched to the new repository and verified as synced
