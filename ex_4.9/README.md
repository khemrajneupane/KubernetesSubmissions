## 4.9. The project, step 25

### Staging for testing:

- Every new commit to the main branch is deployed and tested new changes before releasing them to users.
- The broadcaster logs Todo events but does not send Slack notifications.
- The database is not backed up.

### Production the real application:

- A tagged commit is deployed here as a release.
- The broadcaster logs Todo events and continues sending Slack notifications.
- The database is backed up.

### toggling staging/production:

- in broadcaster/index.js setting we use LOG_ONLY=boolean for following missions:
- LOG_ONLY=true is used for logging events only, no Slack messages go through for staging changes.
- LOG_ONLY=false is used for logging events along with sending Slack notifications for Production environment

### build new image with ex-4.9 tag:

```sh
docker build -t todo-broadcaster:ex-4.9 ./ex_4.9/broadcaster
```

- Import image into k3d:

```sh
k3d image import todo-broadcaster:ex-4.9 -c k3s-default
```

- organizing environments
  - base
  - overlays
    - Staging
    - Production
- I do the work in these orders:
- moving the shared application components into `base/` folder
- creating `staging` and `production` `overlays`
- giving each environment its own namespace and app storage
- configuring `staging` to log broadcaster messages only
- include database backups in production only
- configuring Argo CD for main and tagged releases.

### create base/kustomization.yaml:

- it will keep the common configuration that will be required by both `staging` and `production` environments.
- check the root kustomization of base:

```sh
kubectl kustomize ex_4.9/base
```

- create staging related kustomization.yaml and also `staging` namespace and add to staging/kustomization.yaml along with `broadcaster-patch.yaml`which will declare to use `LOG_ONLY=true` env.variable, replicas: 1 etc.
- let's validate if kustomization for staging is pulling all required config resources:

```sh
kubectl kustomize ex_4.9/overlays/staging
```

- create the production environment, where Slack notifications and database backups remain enabled. Keep `production` specific config resources into `/ex_4.9/overlays/production` just like for `stating`
- in production kustomization.yaml, this time we also add todo_backup
- create `production` related `kustomization.yaml` and also `production` namespace and add to `production/kustomization.yaml` along with `broadcaster-patch.yaml` which will declare to use `LOG_ONLY=false` env.variable, and `replicas: 6` etc.
- let's validate if kustomization for staging is pulling all required config

```sh
kubectl kustomize ex_4.9/overlays/production
```

- next, we need separate: Production/Staging: their own Todo app storage and PostgreSQL database.
- for staging persistentvolume path `/tmp/kube-staging`, `name: todo-app-pv-staging` etc and also create persistentvolumeclaim.
- to include the staging PV and PVC, add these `persistentvolume.yaml` and `persistentvolumeclaim.yaml` to staging's `kustomization.yaml`.

- for production also persistentvolume path `/tmp/kube-production`, `name: todo-app-pv-production` etc and also create persistentvolumeclaim.
- to include the production PV and PVC, add these `persistentvolume.yaml` and `persistentvolumeclaim.yaml` to production's `kustomization.yaml`.
- we need to create separate persistent storage for the production database backups name `todo-backup-pv-production` directory `/tmp/kube-backups-production`
- also create persistentvolumeclaim for backup `todo-backup-pv-production`
- these two backup persistentvolume and volumeclaim needs to be added to production kustomization only.
- create the backup dir on the node:

```sh
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube-backups-production
```

- this dir exists now: `drwxr-xr-x 2 root root 4096 Oct 26 22:05 /tmp/kube-backups-production`
- I have todo-backend-secret and broadcaster-secret created earlier in project namespace. Since, the production broadcaster needs the broadcaster secret in the production namespace, and the Todo backend needs its database secret there too, we just copy them into staging and production namespaces also. So, `todo-backend-secret` is copied to `staging` while `todo-backend-secret` and `broadcaster-secret` are copied to `production`
- next, we need to let argocd track staging and production separately. Hence, we can create for staging: `todo-staging-application.yaml` and for production: `todo-production-application.yaml`
- since argocd config is made to watch changes in `main` branch via `targetRevision: main` and agrocd will deploy them to `staging` namespace destination, we first push to main branch.
- after testing staging we create Git tag: `4.9` as done in production argocd config: `targetRevision: 4.9`. Then we will test in production namespace.
