# Ex: 3.4. Rewritten routing

- we are changing routes and making use of gateway api to re-write/translate those apis to map the application routes.
- change existing /pingpong to / in ping_pong index.js

## build new image for ping_pong after changing index.js:

```sh
docker build -t khemrajneupane/ping_pong:ex-3.4 ./ex_3.4/ping_pong
```

- then push image to dockerhub:

```sh
docker push khemrajneupane/ping_pong:ex-3.4
```

- apply the image to update deployment:

```sh
kubectl apply -f ex_3.4/ping_pong/manifests/deployment.yaml
```

## create cluster:

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

# Enable gateway API:

```sh
gcloud container clusters update dwk-cluster \
  --location=europe-north1-b \
  --gateway-api=standard
```

- and check the gatewayclass:

```sh
kubectl get gatewayclass
```

## create namespace exercises:

```sh
kubectl create namespace exercises
```

- pingpong needs database first, so I deploy postgresSQL first.

```sh
kubectl apply -f ex_3.4/ping_pong/manifests/postgres.yaml
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

### apply both service.yaml and deployment of ping_pong

```sh
kubectl apply -f ex_3.4/ping_pong/manifests/deployment.yaml
kubectl apply -f ex_3.4/ping_pong/manifests/service.yaml
```

- check all resources so far:

```sh
kubectl get pods,svc -n exercises
```

- testing ping-pong internally by portforwarding for local testing:

```sh
kubectl port-forward -n exercises service/ping-pong-svc 3000:3000
```

- then test curl several times:

```sh
curl http://localhost:3000/
```

- the above increases pong count!
- log output deployment uses ConfigMap, so time to deploy config map:

```sh
kubectl apply -f ex_3.4/log_output/manifests/configmap.yaml
```

- then apply log_output deployment also:

```sh
kubectl apply -f ex_3.4/log_output/manifests/deployment.yaml
```

- same way apply service with ClusterIP type:

```sh
kubectl apply -f ex_3.4/log_output/manifests/service.yaml
```

- verify all services running

```sh
kubectl get pods,svc -n exercises
```

### apply the gateway:

```sh
kubectl apply -f ex_3.4/log_output/manifests/gateway.yaml
```

- check gateway is created:

```sh
 kubectl get gateway -n exercises
```

- gateway is created:

```table
NAME         CLASS                            ADDRESS        PROGRAMMED   AGE
my-gateway   gke-l7-global-external-managed   8.233.158.79   True         82s
```

# Change route.yaml so that HTTPRoute maps '/pingpong' to '/' and apply:

```sh
kubectl apply -f ex_3.4/log_output/manifests/route.yaml
```

- check httproute

```sh
kubectl get httproute -n exercises
```

# testing finally:

```sh
curl http://8.233.158.79/pingpong
curl http://8.233.158.79/
```

- the test gives correct response. Everything is working! However, the loadbalancer's health check endpoing '/' looks like causing counts increase unnecessarilly.
- i conclude this working!

### delete cluster to save money:

```sh
gcloud container clusters delete dwk-cluster \
--zone europe-north1-b
```
