# Ex: 3.3. Back to Ingress

- most of the steps will be like in prev-ex_3.2 as we are using the same resources creation codes. We will be using the same docker image from ex_3.2
- we will create cluster again as we deleted previous one, so the creation steps will remain the same.
- We will create Gateway api and related resources in this exercise.

## Creating GKE cluster:

- check zones, project:
  ```sh
  gcloud config get-value project
  gcloud config get-value compute/zone
  ```
- actual cluster:

```sh
gcloud container clusters create dwk-cluster \
  --zone=europe-north1-b \
  --cluster-version=1.36 \
  --disk-size=32 \
  --num-nodes=1 \
  --machine-type=e2-small
```

# Enable gateway API:

```sh
gcloud container clusters update dwk-cluster \
  --location=europe-north1-b \
  --gateway-api=standard
```

## create namespace exercises:

```sh
kubectl create namespace exercises
```

- pingpong needs database first, so I deploy postgresSQL first.

```sh
kubectl apply -f ex_3.3/ping_pong/manifests/postgres.yaml
```

- use in pingpong service type ClusterIP, instead of NodePort this time.

### apply both service.yaml and deployment of ping_pong

`sh
kubectl apply -f ex_3.3/ping_pong/manifests/deployment.yaml
kubectl apply -f ex_3.3/ping_pong/manifests/service.yaml
`

- check all resources so far:

```sh
kubectl get pods,svc -n exercises
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

- log output deployment uses ConfigMap, so time to deploy config map:

```sh
kubectl apply -f ex_3.3/log_output/manifests/configmap.yaml
```

- then apply log_output deployment also:

```sh
kubectl apply -f ex_3.3/log_output/manifests/deployment.yaml
```

- same way apply service with ClusterIP type:

```sh
kubectl apply -f ex_3.3/log_output/manifests/service.yaml
```

- testing ping-pong internally by portforwarding for local testing:

```sh
kubectl port-forward -n exercises service/ping-pong-svc 3000:3000
```

- then test curl:

```sh
curl http://localhost:3000/pingpong
```

- the pong count increases
- Test is OK!
- testing log-output internally:

```sh
kubectl port-forward -n exercises service/log-output-svc 2345:2345
```

```file content: this text is from file
env variable: MESSAGE=hello world
2026-09-25T17:05:54.728Z: 4555c12b2f67fbc32ace2c0d1ab4caee.
Ping / Pongs: 3
```

- the stack is working perfectly without external exposure, not time to create Gateway
- create log_output/manifest/gateway.yaml and add yaml contents

### apply the gateway:

```sh
kubectl apply -f ex_3.3/log_output/manifests/gateway.yaml
```

- check gateway is created:

```sh
 kubectl get gateway -n exercises
```

- gateway is created:

```table
NAME         CLASS                            ADDRESS          PROGRAMMED   AGE
my-gateway   gke-l7-global-external-managed   136.68.148.126   True         104s
```

- then create HTTPRoute also with route.yaml contents and apply:

```sh
kubectl apply -f ex_3.3/log_output/manifests/route.yaml
```

### apply HTTPRoute:

```sh
kubectl apply -f ex_3.3/log_output/manifests/route.yaml
```

- check httproute

```sh
kubectl get httproute -n exercises
```

- httproute created, check shows:

```table
NAME       HOSTNAMES   AGE
my-route               48s
```

- verify HTTPRoute exists and is attached to the namespace:

```sh
kubectl describe httproute my-route -n exercises
```

- verification is successful

### test the public gateway at:

`http://136.68.148.126/` and `http://136.68.148.126/pingpong`

- we get the successful response-

`file content: this text is from file
env variable: MESSAGE=hello world
2026-09-25T17:23:58.369Z: 4555c12b2f67fbc32ace2c0d1ab4caee.
Ping / Pongs: 3`

`pong 3`

- this proves the traffic is now actually going through external load balancer-> gateay -> HTTPRoute -> ClusterIP and to Pod.

### delete cluster to save money:

```sh
gcloud container clusters delete dwk-cluster \
--zone europe-north1-b
```
