## Ex_4.10. The project, the grande finale

- Created a new GitHub repository, `kubernetesSubmissions-configuration`, and cloned it locally.
- Copied the Exercise 4.9 files and folders into `ex_4.10`.
- Kept Kubernetes manifests, Kustomize files, overlays, storage configuration, and Argo CD Application files.
- Removed application source files, such as `index.js`, `package.json`, and `Dockerfile`, from the configuration repository.
- Updated both Argo CD Application files to use the new configuration repository, the `main` branch, and the correct staging and production overlay paths.
- Validated the staging and production configurations using `kubectl kustomize`.
- Next, commit and push the configuration repository, then update the live Argo CD Applications to use it.
