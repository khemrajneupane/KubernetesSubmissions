# Ex_5.7. Deploy to serverless

- previously done ex_5.3 will be used as the base code and changes will be done to accomplish ex 5.7.
- re-create namespace `exercises` because our cluster is new, and we will add resources there.

```sh
kubectl create namespace exercises
```

- deploy StatefulSet postgressql:

```sh
kubectl apply -f ex_5.7/ping_pong/manifests/postgres.yaml
```

- verify resources are running:

```sh
kubectl get pods,svc -n exercises
```

- we will create a new image and push to Dockherhub and use that in knative service.

```sh
docker build -t khemrajneupane/ping_pong:ex-5.7 ./ex_5.7/ping_pong
```

```sh
docker push khemrajneupane/ping_pong:ex-5.7
```

- next we will create Knative Service and apply

```sh
kubectl apply -f ex_5.7/ping_pong/manifests/knative-service.yaml
```

- verify if knative successfully got the image from dockerhub, started application container got the appropriate hostname url and is in READY state.

```sh
kubectl get ksvc -n exercises
```

```table
NAME       URL                                             LATESTCREATED    LATESTREADY      READY   REASON
pingpong   http://pingpong.exercises.172.19.0.3.sslip.io   pingpong-00003   pingpong-00003   True
```

- exec into postgres and create table counter with default value for value column.
- first get containerd container ID inside the k3d node:

```sh
docker exec k3d-knative-cluster-agent-1 crictl ps | grep postgres
```

- use the id `955961094d93d` and exect into cluster and container to open the PostgreSQL terminal:

```sh
docker exec -it k3d-knative-cluster-agent-1 crictl exec -it 955961094d93d psql -U postgres -d postgres
```

- create table and value column:

```sql
CREATE TABLE counter (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);

INSERT INTO counter (id, value) VALUES (1, 0);
```

- check whether pod starts when sending request to ping-pong:

```sh
curl -H "Host: pingpong.exercises.172.19.0.3.sslip.io" http://localhost:8081/
```

```table
NAME                                         READY   STATUS    RESTARTS   AGE
pingpong-00003-deployment-54dc7df799-4rmpp   2/2     Running   0          2s
postgres-stset-0                             1/1     Running   0          94m
```

- after idle for a while Pods get terminated:

```table
NAME                                         READY   STATUS    RESTARTS   AGE
pingpong-00003-deployment-54dc7df799-4rmpp   2/2     Running   0          2s
postgres-stset-0                             1/1     Running   0          94m
pingpong-00003-deployment-54dc7df799-4rmpp   2/2     Terminating   0          62s
pingpong-00003-deployment-54dc7df799-4rmpp   2/2     Terminating   0          62s
pingpong-00003-deployment-54dc7df799-4rmpp   1/2     Terminating   0          92s
```

```sh
kubectl get ksvc,revision,pods -n exercises
```

- after pods disappeared, we can see `Actual replicas 0`and `Desired replicas 0`

```table
NAME                                   URL                                             LATESTCREATED    LATESTREADY      READY   REASON
service.serving.knative.dev/pingpong   http://pingpong.exercises.172.19.0.3.sslip.io   pingpong-00003   pingpong-00003   True

NAME                                          CONFIG NAME   GENERATION   READY   REASON             ACTUAL REPLICAS   DESIRED REPLICAS
revision.serving.knative.dev/pingpong-00001   pingpong      1            False   ContainerMissing
revision.serving.knative.dev/pingpong-00002   pingpong      2            False   ContainerMissing
revision.serving.knative.dev/pingpong-00003   pingpong      3            True                       0                 0

NAME                                             READY   STATUS        RESTARTS   AGE
pod/pingpong-00003-deployment-54dc7df799-4rmpp   1/2     Terminating   0          3m27s
pod/postgres-stset-0                             1/1     Running       0          98m
```

```sh
kubectl get ksvc,revision,pods -n exercises
```

```table
NAME                                   URL                                             LATESTCREATED    LATESTREADY    READY   REASON
service.serving.knative.dev/pingpong   http://pingpong.exercises.172.19.0.3.sslip.io   pingpong-00003   pingpong-00003   True

NAME                                          CONFIG NAME   GENERATION   READY   REASON             ACTUAL REPLICAS DESIRED REPLICAS
revision.serving.knative.dev/pingpong-00001   pingpong      1            False   ContainerMissing
revision.serving.knative.dev/pingpong-00002   pingpong      2            False   ContainerMissing
revision.serving.knative.dev/pingpong-00003   pingpong      3            True
```

### above tells us:

- READY True: the Knative revision is healthy.
- ACTUAL REPLICAS 0: no Ping-pong application Pods are currently running.
- DESIRED REPLICAS 0: Knative currently wants zero Pods.
- PostgreSQL Pod is still running independently.
- So, scaling up and down is working properly.

- next on log-output, we can use `const PING_PONG_URL = "http://pingpong.exercises.svc.cluster.local/pings";` instead of previously used old kubernetes clusterIP service: `http://ping-pong-svc:3000/pings`

- after changes in index.js log-output, lets create image pushe to dockerhub and use it:

```sh
docker build -t khemrajneupane/log-output:ex-5.7 ./ex_5.7/log_output
```

```sh
docker push khemrajneupane/log-output:ex-5.7
```

- before applying log_output's deployment, which needs `log-output-config`, we apply it first:

```sh
kubectl apply -f ex_5.7/log_output/manifests/configmap.yaml
```

- check configmap:

```sh
kubectl get configmaps -n exercises
```

- added the image in log_output's deployment.yaml, now applying:

```sh
kubectl apply -f ex_5.7/log_output/manifests/deployment.yaml
```

- apply also log_output's service:

```sh
kubectl apply -f ex_5.7/log_output/manifests/service.yaml
```

- also there is greeter service, we used it in default-cluster, but we can import the same image into `knative-cluster`too:

```sh
k3d image import greeter:ex-5.3 -c knative-cluster
```

- apply greeter deployments

```sh
kubectl apply -f ex_5.7/greeter/manifests/deployment-v1.yaml
kubectl apply -f ex_5.7/greeter/manifests/deployment-v2.yaml
```

- apply services:

```sh
kubectl apply -f ex_5.7/greeter/manifests/service.yaml
```

- check services:

```sh
 kubectl get services -n exercises
```

- log shows all services created.
- we can further verify greeter services working ok and pointing correct pods

```sh
kubectl get endpoints -n exercises
```

- pods are running ok:

```table
NAME                     ENDPOINTS                                                     AGE
greeter-svc              10.42.0.16:3000,10.42.1.12:3000                               2m25s
greeter-svc-1            10.42.1.12:3000                                               2m25s
greeter-svc-2            10.42.0.16:3000                                               2m25s
pingpong-00003           10.42.2.6:8012,10.42.2.6:8112                                 43h
pingpong-00003-private   10.42.0.15:9091,10.42.0.15:8012,10.42.0.15:8012 + 2 more...   43h
postgres-svc             10.42.1.11:5432
```

- check pods now:

```sh
kubectl get pods -n exercises
```

```table
NAME                                         READY   STATUS    RESTARTS   AGE
greeter-v1-bc6d95746-r9t8x                   1/1     Running   0          8m7s
greeter-v2-56c54ccb8b-hbqqv                  1/1     Running   0          8m7s
log-output-67c5dbf447-glrw5                  1/1     Running   0          41h
pingpong-00003-deployment-54dc7df799-h8mwr   2/2     Running   0          52m
postgres-stset-0                             1/1     Running   0          43h
```

- port-forward `log-output-svc`

```sh
kubectl port-forward -n exercises service/log-output-svc 8080:2345
```

- then the site is working at `http://localhost:8080/` displaying contents:

```table
file content: this text is from file
env variable: MESSAGE=hello world
2026-11-08T17:19:25.335Z: 7135f9d086f971ab993296975ae02e1c.
Ping / Pongs: 3

greetings: Hello from version 2
```

- testing Knative scale-up and scale-down.

```sh
kubectl get ksvc,revision,pods -n exercises
```

```table
NAME                                   URL                                             LATESTCREATED    LATESTREADY      READY   REASON
service.serving.knative.dev/pingpong   http://pingpong.exercises.172.19.0.3.sslip.io   pingpong-00003   pingpong-00003   True

NAME                                          CONFIG NAME   GENERATION   READY   REASON             ACTUAL REPLICAS   DESIRED REPLICAS
revision.serving.knative.dev/pingpong-00001   pingpong      1            False   ContainerMissing
revision.serving.knative.dev/pingpong-00002   pingpong      2            False   ContainerMissing
revision.serving.knative.dev/pingpong-00003   pingpong      3            True                       1                 1

NAME                                             READY   STATUS    RESTARTS      AGE
pod/greeter-v1-bc6d95746-r9t8x                   1/1     Running   1 (13m ago)   4h10m
pod/greeter-v2-56c54ccb8b-hbqqv                  1/1     Running   1 (13m ago)   4h10m
pod/log-output-67c5dbf447-glrw5                  1/1     Running   1 (13m ago)   45h
pod/pingpong-00003-deployment-54dc7df799-zdn82   2/2     Running   0             12m
pod/postgres-stset-0                             1/1     Running   1 (13m ago)   47h
```

- Our pingpong pod is running `pod/pingpong-00003-deployment-54dc7df799-zdn82   2/2     Running ` and actual and desired replicas are at 1 for now instead of scaling down to 0. This is because log output application has `/healthz` endpoint that calls pingpong which ultimately causes log_output app to wake up. In fact we have Kubernetes checking Log Output's `/healthz` endpoint every 5 seconds. So, logoutput can never sleep to 0.

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

- Temporarily, lets stop these health-check requests by removing readinessProbe container and test again:

```sh
kubectl patch deployment log-output -n exercises --type=json -p='[{"op":"remove","path":"/spec/template/spec/containers/0/readinessProbe"}]'
```

- then we check pods in watching w mode:

```sh
 kubectl get pods -n exercises -w
```

```table
NAME                          READY   STATUS    RESTARTS      AGE
greeter-v1-bc6d95746-r9t8x    1/1     Running   1 (31m ago)   4h27m
greeter-v2-56c54ccb8b-hbqqv   1/1     Running   1 (31m ago)   4h27m
log-output-6bfd886989-m7h5q   1/1     Running   0             7m8s
postgres-stset-0              1/1     Running   1 (31m ago)   2d
```

- Thus we can see that the earlier running pingpong pod got removed. So, this pod is not in the above table: `pod/pingpong-00003-deployment-54dc7df799-zdn82   2/2     Running `
- In that case we should have 0 replicas. So, lets test:

```sh
kubectl get revision pingpong-00003 -n exercises
```

```table
NAME             CONFIG NAME   GENERATION   READY   REASON   ACTUAL REPLICAS   DESIRED REPLICAS
pingpong-00003   pingpong      3            True             0                 0
```

- above logs proves, our Knative scaled down to 0. Good status is that Knative services are still healthy, `READY=True`
- Restarted portforwarding, opened pods in wathe mode and I can see the pods transitiioning provess:

```sh
kubectl get pods -n exercises -w
```

```table
NAME                          READY   STATUS    RESTARTS      AGE
greeter-v1-bc6d95746-r9t8x    1/1     Running   1 (45m ago)   4h41m
greeter-v2-56c54ccb8b-hbqqv   1/1     Running   1 (45m ago)   4h41m
log-output-6bfd886989-m7h5q   1/1     Running   0             21m
postgres-stset-0              1/1     Running   1 (45m ago)   2d
pingpong-00003-deployment-54dc7df799-2rgtq   0/2     Pending   0             0s
pingpong-00003-deployment-54dc7df799-2rgtq   0/2     Pending   0             0s
pingpong-00003-deployment-54dc7df799-2rgtq   0/2     ContainerCreating   0             0s
pingpong-00003-deployment-54dc7df799-2rgtq   1/2     Running             0             1s
pingpong-00003-deployment-54dc7df799-2rgtq   2/2     Running             0             1s
pingpong-00003-deployment-54dc7df799-2rgtq   2/2     Terminating         0             63s
pingpong-00003-deployment-54dc7df799-2rgtq   2/2     Terminating         0             63s
```

- also we can verify the replicas scaled up:

```sh
kubectl get revision pingpong-00003 -n exercises
```

```table
NAME             CONFIG NAME   GENERATION   READY   REASON   ACTUAL REPLICAS   DESIRED REPLICAS
pingpong-00003   pingpong      3            True             1                 1
```
