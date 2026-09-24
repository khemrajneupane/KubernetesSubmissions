# Ex: 3.2. Back to Ingress

- add / endpoint in index.js for pingpong backend service health check

## build docker image and push to registery

```sh
docker build -t khemrajneupane/ping_pong:ex-3.2 ./ex_3.2/ping_pong
```

- Apply image in local kubernete:

```sh
kubectl apply -f ex_3.2/ping_pong/manifests/deployment.yaml
```

- confirm the image in pod:

```sh
kubectl describe pod -n exercises -l app=ping-pong | grep "Image:"
```

- check the new health endpoint / is running:

```sh
kubectl run curl-test \
  -n exercises \
  --rm -it \
  --image=curlimages/curl \
  --restart=Never \
  -- curl http://ping-pong-svc:3000/
```

- the service.yaml type should be NodePort instead of LoadBalancer and apply and same for the service in log_output. Postgres is internal so not changing to NodePort, it can remain ClusterIP

```sh
kubectl apply -f ex_3.2/ping_pong/manifests/service.yaml
```

```sh
kubectl apply -f ex_3.2/log_output/manifests/service.yaml
```

- Change the ingress for GKE:
- remove the following traefik from ingress as GKE uses it own and traefik is only for local also local:
  `ingressClassName: traefik` and `host: log-output.localhost`

## prepare GKE deployment

- verify project:

```sh
gcloud config get-value project
```

- verify zone:

```sh
gcloud config get-value compute/zone
```

- verify active account where the \* account is active one:

```sh
gcloud auth list
```

- Create cluster itself:

```sh
gcloud container clusters create dwk-cluster \
  --zone=europe-north1-b \
  --cluster-version=1.36 \
  --disk-size=32 \
  --num-nodes=1 \
  --machine-type=e2-small
```

## connect local kubectl to GKE:

```sh
gcloud container clusters get-credentials dwk-cluster \
  --zone=europe-north1-b
```

- verify kubernetes context in google cloud:

```sh
kubectl config current-context
```

- and:

```sh
kubectl get nodes
```

- since all our manifests are in 'exercise' namespace so need to create one in gke:

```sh
kubectl create namespace exercises
```

- pingpong needs database first, so I deploy postgresSQL first.

```sh
kubectl apply -f ex_3.2/ping_pong/manifests/postgres.yaml
```

- check postgres pod:

```sh
kubectl get pods -n exercises
```

- deploy ping_pong also:

```sh
kubectl apply -f ex_3.2/ping_pong/manifests/service.yaml
```

- since postgres is still empty, we need to create table so first loginto the db:

```sh
kubectl exec -it postgres-stset-0 -n exercises -- \
  psql -U postgres -d postgres
```

- then create table:

```sql
CREATE TABLE counter (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL
);

INSERT INTO counter (value) VALUES (0);
```

- verify the ping-pong app or add counts or run the following command several times:

```sh
kubectl run curl-test \
  -n exercises \
  --rm -it \
  --image=curlimages/curl \
  --restart=Never \
  -- curl http://ping-pong-svc:3000/pingpong
```

### deploy log-output, configmap, service:

```sh
kubectl apply -f ex_3.2/log_output/manifests/deployment.yaml
```

```sh
kubectl apply -f ex_3.2/log_output/manifests/configmap.yaml
```

```sh
kubectl apply -f ex_3.2/log_output/manifests/service.yaml
```

- verify log-output:

```sh
kubectl run curl-test \
  -n exercises \
  --rm -it \
  --image=curlimages/curl \
  --restart=Never \
  -- curl http://log-output-svc:2345/
```

- apply ingress:

```sh
kubectl apply -f ex_3.2/log_output/manifests/ingress.yaml
```

- all resources are created and healthy. Now lets check the public ip/address of ingress:

```sh
kubectl get ingress -n exercises
```

- the ingress output is displaying the address:

```table
NAME                 CLASS    HOSTS   ADDRESS          PORTS   AGE
log-output-ingress   <none>   *       136.81.252.158   80      11m
```

- then we can curl or check in browser:
  `http://136.81.252.158/``
- the response is:
  ```file content: this text is from file
  env variable: MESSAGE=hello world
  2026-09-24T16:32:15.184Z: 5e5c918225664ec28533acc30a697fac.
  Ping / Pongs: 2
  ```
- also check pingpong path:
  `http://136.81.252.158/pingpong`
- everything works!!!

### delete cluster to save money:

```sh
gcloud container clusters delete dwk-cluster \
--zone europe-north1-b
```
