# 2.10. The project, step 13

refactore the existing todo_backend/index.js to generate logs:

```
console.log("Received todo request");
console.log("Todo rejected: empty todo");
res.status(400).send("Todo is required");
console.log(`Todo rejected: too long (${todo.length} characters)`);
res.status(400).send("Todo is too long");
console.log(`Todo accepted: ${todo}`);
console.error("Failed to create todo:");
```

- test all the above logging or make it possible to get the above loggings by means of:
- - port forwarding: svc/todo-postgres-svc
- - running with node the index.js by providing env url variable: DATABASE_URL="postgres://postgres:postgres@localhost:5433/postgres" node ex_2.10/todo_backend/index.js
- - curl request for proper post:

- - ```curl
    curl -X POST http://localhost:3001/todos \
      -H "Content-Type: application/json" \
      -d '{"todo":"Learn Kubernetes request logging"}'
    {"todo":"Learn Kubernetes request logging"}%
    ```
- - curl request with long post:
- - ```curl
    curl -X POST http://localhost:3001/todos \
      -H "Content-Type: application/json" \
      -d '{"todo":"This is intentionally a very long Todo that contains more than one hundred and forty characters so that we can verify that the backend correctly rejects it and logs the rejected request."}'
    ```
- - checking into the database and verifying the long todo is not added while proper todo is added:
- - ```sh
    kubectl exec -it -n project todo-postgres-0 -- \
      psql -U postgres -d postgres
    ```

## build docker image for for todo_backend:

```bash
docker build -t todo_backend:todo_backend_ex_2.10 ./ex_2.10/todo_backend
```

## import image todo_backend:todo_backend_ex_2.10 into k3d:

```sh
k3d image import todo_backend:todo_backend_ex_2.10 -c k3s-default
```

## apply deployment after adding proper docker image- todo_backend:todo_backend_ex_2.10:

```sh
kubectl apply -f ex_2.10/todo_backend/manifests/deployment.yaml
```

- run the logs:

```sh
kubectl logs -n project todo-backend-6f4fc4f6bd-66bqn
```

- hence, the kubernetes part for logs is ok, next is to make Alloy collect container outputs/logs and send to Loki and to Grafana.

# installing helm kubernetes package manager like npm for node package manager:

```sh
brew install helm
```

- add helm add repository for prometheus, grafana:

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

- create monitoring namespace:

```sh
kubectl create namespace monitoring
```

- create dedicated monitoring folder and inside it create all related files folders.
- inside monitoring, create prom-values.yaml, loki-values.yaml,k8smon-values.yaml,grafana-values.yaml add the contents as given in the course material
- then install Promethesu using helm package manager inside monitoring namespace, using the correct paths:

- - Prometheus:

```sh
helm upgrade --install prom prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --values ex_2.10/todo_backend/monitoring/prom-values.yaml
```

- - Loki:

```sh
helm upgrade --install loki grafana/loki \
  --namespace monitoring \
  --values ex_2.10/todo_backend/monitoring/loki-values.yaml
```

- - Alloy/k8s-monitoring:

```sh
helm upgrade --install k8smon grafana/k8s-monitoring \
  --namespace monitoring \
  --values ex_2.10/todo_backend/monitoring/k8smon-values.yaml
```

- - Grafana:

```sh
helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --values ex_2.10/todo_backend/monitoring/grafana-values.yaml
```

### what services are installed so far:

```table
kubectl get svc -n monitoring
NAME                            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE
grafana                         ClusterIP   10.43.49.47     <none>        80/TCP               99s
k8smon-alloy-operator           ClusterIP   10.43.93.251    <none>        8081/TCP,8082/TCP    3m19s
k8smon-alloy-singleton          ClusterIP   10.43.136.1     <none>        12345/TCP            3m4s
loki                            ClusterIP   10.43.28.141    <none>        3100/TCP,9095/TCP    9m2s
loki-canary                     ClusterIP   10.43.60.224    <none>        3500/TCP             9m2s
loki-chunks-cache               ClusterIP   None            <none>        11211/TCP,9150/TCP   9m2s
loki-gateway                    ClusterIP   10.43.244.136   <none>        80/TCP               9m2s
loki-headless                   ClusterIP   None            <none>        3100/TCP             9m2s
loki-memberlist                 ClusterIP   None            <none>        7946/TCP             9m2s
loki-results-cache              ClusterIP   None            <none>        11211/TCP,9150/TCP   9m2s
prom-kube-state-metrics         ClusterIP   10.43.178.24    <none>        8080/TCP             13m
prom-prometheus-node-exporter   ClusterIP   10.43.51.159    <none>        9100/TCP             13m
prom-prometheus-pushgateway     ClusterIP   10.43.122.9     <none>        9091/TCP             13m
prom-prometheus-server          ClusterIP   10.43.190.57    <none>        80/TCP               13m
```

### port-forward grafana to access from my computer at port 3000:

```sh
kubectl port-forward -n monitoring svc/grafana 3000:80
```

- and grafana dashboard is available at: http://localhost:3000
- testing with same curl requests as done earlier in line 20-36 above.
- i can see logs properly appearing in grafana.
- it works!
