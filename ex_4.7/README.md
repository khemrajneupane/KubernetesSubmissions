# Ex: 4.7. Baby steps to GitOps

- create image for log_output and push to Hub:

```sh
docker build -t khemrajneupane/log-output:ex-4.7 ./ex_4.7/log_output
```

```sh
docker push khemrajneupane/log-output:ex-4.7
```

- added image in deployment and added in ingress: ingressClassName: traefik

### apply resources:

```sh
kubectl apply \
  -f ex_4.7/log_output/manifests/configmap.yaml \
  -f ex_4.7/log_output/manifests/deployment.yaml \
  -f ex_4.7/log_output/manifests/service.yaml \
  -f ex_4.7/log_output/manifests/ingress.yaml
```

- verify resources:

```sh
kubectl get pods,services,ingress -n exercises
```

```table
NAME                                     READY   STATUS    RESTARTS      AGE
pod/log-output-7c4cdf9ff5-hr48z          1/1     Running   0             89s
pod/ping-pong-rollout-57b457cbd6-h687n   1/1     Running   1 (35m ago)   4d9h
pod/postgres-stset-0                     1/1     Running   1 (35m ago)   10d

NAME                     TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/log-output-svc   ClusterIP   10.43.239.197   <none>        2345/TCP   89s
service/ping-pong-svc    ClusterIP   10.43.9.183     <none>        3000/TCP   10d
service/postgres-svc     ClusterIP   10.43.188.201   <none>        5432/TCP   10d

NAME                                           CLASS     HOSTS   ADDRESS         PORTS   AGE
ingress.networking.k8s.io/log-output-ingress   traefik   *       172.18.0.3,172.18.0.4,172.18.0.5   80      89s
```

- test endpoints, port-forward the log-output-svc and check curl:

```sh
kubectl port-forward -n exercises service/log-output-svc 8080:2345
```

```curl

curl http://localhost:8080/
```

- we get:

```table
file content: this text is from file
env variable: MESSAGE=hello world
2026-10-20T12:02:07.118Z: 23fd5d9355a71da801036350a40b3966.
Ping / Pongs: 0
```

### create `argocd`namespace and install Argo CD using github installer

```sh
kubectl create namespace argocd
```

```sh
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

- check argo cd pods:

```sh
kubectl get pods -n argocd
```

- we get it installed:

```table
NAME                                               READY   STATUS    RESTARTS   AGE
argocd-application-controller-0                    1/1     Running   0          78s
argocd-applicationset-controller-65864554c-bfgts   1/1     Running   0          79s
argocd-dex-server-9c6f85f5-784vl                   1/1     Running   0          79s
argocd-notifications-controller-6d48f8946-w54mv    1/1     Running   0          79s
argocd-redis-8587cb8bf4-799kr                      1/1     Running   0          79s
argocd-repo-server-5cf65bffc-w85d5                 1/1     Running   0          79s
argocd-server-7545844984-qlthd                     1/1     Running   0          78s
```

- verified that postgres is working, ping_pong is working and log_output is also working at this stage. We are using prvious deployments of resources for ping_pong.

- create argocd/application.yaml with github repository url, server, namespaces etc.
- created also workflow `ex-4.7-gitops.yml` with DOCKERHUB_USERNAME, DOCKERHUB_TOKEN ...
- Create deplpoyment via kustomization.yaml
- commit and push to GitHub.
- github action passed and dockerhub gets a new image with new tag `sha-921fed18ce2b8a6f88eab2b9d...`
- git pull to check if deployment gets new image with the above mentioned tag.

```sh
git pull origin main
```

- pull updates our deploymen.yaml where image is now: `image: khemrajneupane/log-output:sha-921fed18ce2b8a6f88eab2b9d04a7521a8c92be4`
- lets registers the log-output application with Argo CD by deploying the argocd/application.yaml:

```sh
kubectl apply -f ex_4.7/log_output/argocd/application.yaml
```

- after applying now ArgoCD knows which repository of mine to monitor.
- check ArgoCD synchronization:

```sh
kubectl get application -n argocd log-output
```

- above output:

```table
NAME         SYNC STATUS   HEALTH STATUS
log-output   Synced        Healthy
```

- to test complete GitOps workflow, I will make some tiny and harmless changes in log_output/index.js e.g. in the `/`route, I can add extra text: `GitOps test` and commit to GitHub.
- again, new image tag pushed to DockerHub after successful github workflow run
- git pull verifies new image tag used now in deployment: `khemrajneupane/log-output:sha-5005ebc0fdee98e9398a977520717b49c193312a`
- Check Kubernetes has completed the update and the new Pod is ready:

```sh
kubectl rollout status deployment/log-output -n exercises --timeout=120s
```

- Lets verify the earlier changes in index.js shows up. Portforward log output svc:

```sh
kubectl port-forward -n exercises service/log-output-svc 8080:2345
```

```sh
 curl http://localhost:8080/
```

- the above output clearly shows those extra texts added in index.js `GitOps test: deployed automatically!`:

```table
file content: this text is from file
env variable: MESSAGE=hello world
2026-10-21T16:43:35.015Z: 1708b768c2d980945814c8e3112a0205.
Ping / Pongs: 2

GitOps test: deployed automatically!%
```

- Hence, the complete path from code changes through Github Actions and ArgoCD to the running log_output application verifies Baby steps to GitOps is working!!!
