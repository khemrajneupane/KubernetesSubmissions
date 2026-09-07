# Ex: 3.1. Pingpong GKE

- I have gcloud (Google Cloud CLI) already installed

# login to Google console:

```sh
gcloud auth login
```

# create a new project:

- `dwk-gke`
- let google cloud use this project: `dwk-gke-507811`

```sh
gcloud config set project dwk-gke-507811

```

- verify project:

```sh
gcloud config get-value project
```

- final confirmation that this project is linked to my free credits billing account:

```sh
gcloud billing projects describe dwk-gke-507811
```

- install gke-gcloud-auth-plugin so that we can communicate with GKE in Google Cloud:

```sh
  gcloud components install gke-gcloud-auth-plugin
```

# enable Kubernetes Engine Api:

```sh
gcloud services enable container.googleapis.com
```

# create cluster itself:

```sh
gcloud container clusters create dwk-cluster \
  --zone=europe-north1-b \
  --cluster-version=1.36 \
  --disk-size=32 \
  --num-nodes=1 \
  --machine-type=e2-small
```

- The installation should set the kubeconfig to point to the newly created cluster:

```sh
kubectl cluster-info
```

# connect local kubectl to GKE:

```sh
gcloud container clusters get-credentials dwk-cluster \
  --zone=europe-north1-b
```

# verify connection:

```sh
kubectl config current-context
```

- kubectl is now pointing to GKE, not my local k3d cluster anymore.

# check cluster itself is healthy:

```sh
kubectl get nodes
```

# if cluster is not used anymore I can delete it:

```sh
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```

# preliminary housekeeping:

- gke needs publicly available docker image so i pushed both images to dockerhus
- both deployments are given dockerhub image: `image: khemrajneupane/ping_pong:ex-2.7`, `image: khemrajneupane/log-output:ex-2.5`
- postgres.yaml does not need `storageClassName: local-path` anymore so removed.
- create namespace exercises

```sh
kubectl create namespace exercises
```

### apply postgres

```sh
kubectl apply -f ex_3.1/ping_pong/manifests/postgres.yaml
```

- check running pods or postgresql at this point:

```sh
kubectl get pods -n exercises
```

- postgres is healthy:

```table
NAME               READY   STATUS    RESTARTS   AGE
postgres-stset-0   1/1     Running   0          3s
```

### start psql directly and connects it to PostgreSQL Service:

```sh
kubectl run psql-client -n exercises --rm -it --restart=Never --image=postgres:16 -- psql -h postgres-svc -U postgres -d postgres
```

- then create table counter:

```sql
CREATE TABLE counter (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL
);
```

- initialize counter with 0:

```sql
INSERT INTO counter (value) VALUES (0);
```

### apply ping_pong deployment:

```sh
kubectl apply -f ex_3.1/ping_pong/manifests/deployment.yaml
```

- check both pods are running:

```sh
kubectl get pods -n exercises
```

### apply the ping_pong Service that has declared type: LoadBalancer

```sh
kubectl apply -f ex_3.1/ping_pong/manifests/service.yaml
```

- check loadbalancer status:

```sh
kubectl get svc -n exercises
```

Initially, pending:

```table
NAME            TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
ping-pong-svc   LoadBalancer   34.118.235.83   <pending>     3000:30845/TCP   35s
```

After initialization finishes:

```table
NAME            TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE
ping-pong-svc   LoadBalancer   34.118.235.83   35.228.88.230   3000:30845/TCP   2m57s
```

### test ping_pong with active EXTERNAL-IP:

```sh
curl http://35.228.88.230:3000/pingpong
```

- counter pong increases on every request.
- ping_pong server is working, now I make log_output works in sync:
- deploy all log_output related manifests

### deploy:

```sh
kubectl apply -f ex_3.1/log_output/manifests/configmap.yaml
```

```sh
kubectl apply -f ex_3.1/log_output/manifests/deployment.yaml
```

- check all pods at this point:

```sh
 kubectl get pods -n exercises
```

```sh
 kubectl apply -f ex_3.1/log_output/manifests/service.yaml
```

- check pods again and make sure log_output is ClusterIP type:

```sh
kubectl get svc -n exercises
```

- since log-output-svc is ClusterIP, I don't need another expensive LoadBalancer. I can test it temporarily using kubectl port-forward:

```sh
kubectl port-forward svc/log-output-svc 8080:2345 -n exercises
```

- verify logs outputs are correct with curl:

```sh
curl http://localhost:8080/
```

- then I see the exact outputs:

```
file content: this text is from file
env variable: MESSAGE=hello world
2026-09-07T11:04:19.892Z: 1259daabac7e3f4d2182ffc29a69e4b6.
Ping / Pongs: 2
```

- deployment of pingpong/log app in GKE is successful

- delete cluster again:

```sh
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```
