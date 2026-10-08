# Ex: 4.1. Readines probe

- check the kubectl context and switch to local default

```sh
kubectl config get-contexts
```

- Switch to context "k3d-k3s-default"

```sh
kubectl config use-context k3d-k3s-default
```

- lets add /healthz endpoint in ping_pong/index.js and just test database connectivity with proper logging and query:

```sql
SELECT 1
```

- add pingpong readiness prob in `ping_pong/manifests/deployment.yaml` for container:

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

- initialDelaySeconds- wait 5 seconds after the continer starts
- periodSeconds- check every 5 seconds

- since our pingpong has new endpoing /healthz, we need to rebuild docker image:

```sh
docker build -t ping_pong:ex-4.1 ./ex_4.1/ping_pong
```

- make sure ping_pong image exists in docker:

```sh
docker images | grep ping_pong
```

- import image to k3s-default:

```sh
k3d image import ping_pong:ex-4.1 -c k3s-default
```

### now, we can deploy pingpong without PostgresSQL so that the readiness prob detects the missing db:

- before deploying lets create namespace `exercises` as our resources are added there:

```sh
kubectl create namespace exercises
```

- now the namespace exercises exists, so lets apply following one by one:

```sh
kubectl apply -f ex_4.1/ping_pong/manifests/deployment.yaml
kubectl apply -f ex_4.1/ping_pong/manifests/service.yaml
```

- now lets check the pods readiness:

```sh
kubectl get pods -n exercises
```

- we get:

```table
NAME                               READY   STATUS    RESTARTS   AGE
ping-pong-deploy-b7f5d54df-t9zgj   0/1     Running   0          26s
```

- we have one container in ping-pong container where it is in running state but not ready.
- we can verify or prob into pod to understand why not ready:

```sh
kubectl describe pod -l app=ping-pong -n exercises
```

```table
Events:
  Type     Reason     Age                    From               Message
  ----     ------     ----                   ----               -------
  Normal   Scheduled  7m1s                   default-scheduler  Successfully assigned exercises/ping-pong-deploy-b7f5d54df-t9zgj to k3d-k3s-default-server-0
  Normal   Pulled     7m1s                   kubelet            Container image "ping_pong:ex-4.1" already present on machine and can be accessed by the pod
  Normal   Created    7m1s                   kubelet            Container created
  Normal   Started    7m1s                   kubelet            Container started
  Warning  Unhealthy  110s (x64 over 6m54s)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 500
```

- from the above describe pod, we can understand the readiness events: `Readiness probe failed: HTTP probe failed with statuscode: 500`
- So, kubernetes health check did run /healthz route and returned 500.
- first kubernetes **scheduled** the pod a node `k3d-k3s-default-server-0`
- then it pulled correct image `ping_pong:ex-4.1`
- then it created container
- then started the pod
- then checked health and found the `Readiness Prob Failed!`

### first part of the assignment thus gets solved here.

- We add a `/healthz` endpoint to the `log_output` application, then create a new Docker image, import it into k3d, and update/apply the Deployment.
- The `/healthz` endpoint checks whether Log output can successfully communicate with Ping-pong by fetching `PING_PONG_URL`.
- If the request to Ping-pong succeeds, `/healthz` returns `HTTP 200 OK`, meaning Log output is ready.
- If the request fails, `/healthz` returns `HTTP 500`, meaning Log output is not ready.
- Since Ping-pong is currently not ready because PostgreSQL is unavailable, the Log output readiness check should also fail at this stage.

### build image:

```sh
docker build -t log_output:ex-4.1 ./ex_4.1/log_output
```

- import image to k3s-default:

```sh
k3d image import log_output:ex-4.1 -c k3s-default
```

- now use image `log_output:ex-4.1` in deployment
- apply deployment and service:

```sh
kubectl apply -f ex_4.1/log_output/manifests/deployment.yaml
kubectl apply -f ex_4.1/log_output/manifests/service.yaml
kubectl apply -f ex_4.1/log_output/manifests/configmap.yaml
```

### check po:

```sh
kubectl get pods -n exercises
```

- the above shows the status of pods:

```table
NAME                               READY   STATUS    RESTARTS   AGE
log-output-55f4d965d-r6l6h         0/1     Running   0          8m32s
ping-pong-deploy-b7f5d54df-t9zgj   0/1     Running   0          45m
```

- ping-pong is Running but not Ready as PostgresSql is unavailable
- log-output is also Running but not Ready as it cannot successfully communicate with pingpong
- good thing is that neither of the containers restart because they are not Ready.
- to verify why log-output's readiness has failed:

```sh
kubectl describe pod -l app=log-output -n exercises
```

```table
Events:
  Type     Reason       Age                     From               Message
  ----     ------       ----                    ----               -------
  Normal   Scheduled    13m                     default-scheduler  Successfully assigned exercises/log-output-55f4d965d-r6l6h to k3d-k3s-default-agent-0
  Warning  FailedMount  7m34s (x11 over 13m)    kubelet            MountVolume.SetUp failed for volume "config-volume" : configmap "log-output-config" not found
  Normal   Pulled       5m31s                   kubelet            Container image "log_output:ex-4.1" already present on machine and can be accessed by the pod
  Normal   Created      5m31s                   kubelet            Container created
  Normal   Started      5m31s                   kubelet            Container started
  Warning  Unhealthy    3m45s (x21 over 5m24s)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 500
```

- the log shows important readiness failed Event: `Warning  Unhealthy    3m45s (x21 over 5m24s)  kubelet Readiness probe failed: HTTP probe failed with statuscode: 500`
- thus the containers themselves are alive, but Kubernetes knows they aren't currently able to serve traffic.

### the second part of the assignment thus gets solved here.

- Now we will deploy postgres stateful and verify all containers has readiness 1/1 and status running.

```sh
kubectl apply -f ex_4.1/ping_pong/manifests/postgres.yaml
```

- again get pods immediately after apply:

```table
NAME                               READY   STATUS    RESTARTS   AGE
log-output-55f4d965d-r6l6h         0/1     Running   0          23m
ping-pong-deploy-b7f5d54df-t9zgj   0/1     Running   0          60m
postgres-stset-0                   1/1     Running   0          6s
```

- after periodSeconds: 5, we get pods again:

```table
NAME                               READY   STATUS    RESTARTS   AGE
log-output-55f4d965d-r6l6h         0/1     Running   0          26m
ping-pong-deploy-b7f5d54df-t9zgj   1/1     Running   0          63m
postgres-stset-0                   1/1     Running   0          2m52s
```

- But my log-output is still not ready, my guess is that I have not yet created `count` table in postgres, but lets verify:

```sh
kubectl describe pod -l app=log-output -n exercises
```

- but still not ready:

```table
Events:
  Type     Reason       Age                    From               Message
  ----     ------       ----                   ----               -------
  Normal   Scheduled    27m                    default-scheduler  Successfully assigned exercises/log-output-55f4d965d-r6l6h to k3d-k3s-default-agent-0
  Warning  FailedMount  21m (x11 over 27m)     kubelet            MountVolume.SetUp failed for volume "config-volume" : configmap "log-output-config" not found
  Normal   Pulled       19m                    kubelet            Container image "log_output:ex-4.1" already present on machine and can be accessed by the pod
  Normal   Created      19m                    kubelet            Container created
  Normal   Started      19m                    kubelet            Container started
  Warning  Unhealthy    2m50s (x208 over 19m)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 500
```

- i checked the logs in ping-pong and i can see `Failed to get counter: error: relation "counter" does not exist`:

```sh
kubectl logs ping-pong-deploy-b7f5d54df-t9zgj -n exercises
```

- as expected always, we need to create counter table in postgres:

```sh
kubectl exec -it postgres-stset-0 -n exercises -- psql -U postgres -d postgres
INSERT INTO counter (value) VALUES (0);
```

- and now `kubectl get po -n exercises` shows ready state ok:

```table
log-output-55f4d965d-r6l6h         1/1     Running   0          116m
ping-pong-deploy-b7f5d54df-t9zgj   1/1     Running   0          152m
postgres-stset-0                   1/1     Running   0          92m
```

- lets execute wget inside ping-pong-deploy-b7f5d54df-t9zgj

```sh
kubectl exec -it ping-pong-deploy-b7f5d54df-t9zgj -n exercises -- wget -qO- http://localhost:3000/
```

- the above increases pong
- temporarilly, lets port forward the log_output:

```sh
kubectl port-forward service/log-output-svc 8080:2345 -n exercises
```

- now, `http://localhost:8080/` this shows the exact contents
- everything works!
