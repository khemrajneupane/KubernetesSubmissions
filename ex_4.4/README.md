# Ex: 4.4. Your canary

- since we removed `exercises` namespace, lets recreate it to put all our resources there

```sh
kubectl create namespace exercises
```

- deploy postgres.yaml, create tables in postgres and make it ready.

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/postgres.yaml
```

```sh
kubectl exec -it -n exercises postgres-stset-0 -- psql -U postgres
```

```sql
CREATE TABLE counter (
  id SERIAL PRIMARY KEY,
  value INTEGER NOT NULL
);
```

```sql
INSERT INTO counter (value) VALUES (0);
```

- we need Argo Rollouts in order to manage canary updates and run Prometheus-based analysis, however it is not yet installed, so lets do so in `argo-rollouts` namespace:

```sh
kubectl create namespace argo-rollouts
```

```sh
kubectl apply -n argo-rollouts \
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

- The initial installation failed because some CRDs exceeded the annotation size limit. Retried with server-side apply as suggested in [argo-rollouts-docs](https://github.com/argoproj/argo-rollouts/blob/master/docs/installation.md).

```sh
kubectl apply --server-side \
  -n argo-rollouts \
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

- verify:

```sh
kubectl get pods -n argo-rollouts
```

```table
NAME                             READY   STATUS    RESTARTS   AGE
argo-rollouts-69645d4879-trl2w   1/1     Running   0          14m
```

- apply service.yaml also:

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/service.yaml
```

- Now, create `AnalysisTemplate` in analysistemplate.yaml
- Then create `rollout.yaml` also
- argo rollout starts a canary update and reaches the analysis step and analysis runs the Prometheus query.
- validate analysistemplate and rollout with `dry-run`:

```sh
kubectl apply --dry-run=client -f ex_4.4/ping_pong/manifests/analysistemplate.yaml
```

```sh
kubectl apply --dry-run=client -f ex_4.4/ping_pong/manifests/rollout.yaml
```

- apply both:

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/analysistemplate.yaml
```

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/rollout.yaml
```

- check pods

```sh
kubectl get pods -n exercises
```

```table
NAME                                 READY   STATUS    RESTARTS   AGE
ping-pong-rollout-7c58d44f88-9zj79   1/1     Running   0          39s
postgres-stset-0                     1/1     Running   0          5h8m
```

```sh
kubectl get rollouts -n exercises
```

```table
NAME                DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
ping-pong-rollout   1         1         1            1           20s
```

- I now set a deliberately low CPU threshold `successCondition: result[0] < 0.0000001` to test whether Argo Rollouts blocks an update when the analysis fails.
- then apply again:

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/analysistemplate.yaml
```

- after the above apply, we apply rollout again with harmless edits on the template:

```yaml
annotations:
  rollout-test: low-cpu-threshold
```

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/rollout.yaml
```

```sh
kubectl get analysisruns -n exercises
```

```table
NAME                               STATUS    AGE
ping-pong-rollout-8545dbfbfc-2-1   Running   17s
```

- I installed also:

```sh
brew install argoproj/tap/kubectl-argo-rollouts
```

- I can view the resources in tree in watch mode:

```sh
kubectl argo rollouts get rollout ping-pong-rollout -n exercises --watch
```

- inspect the analysis events

```sh
kubectl describe analysisrun ping-pong-rollout-8545dbfbfc-2-1 -n exercises
```

```sh
kubectl describe rollout ping-pong-rollout -n exercises
```

```table
Events:
  Type     Reason             Age   From                 Message
  ----     ------             ----  ----                 -------
  Warning  MetricFailed       26s   rollouts-controller  Metric 'namespace-cpu-usage' Completed. Result: Failed
  Warning  AnalysisRunFailed  26s   rollouts-controller  Analysis Completed. Result: Failed
```

- hence, argo rollouts asked prometheus for the namespace's CPU usage and checked whether the result was below an extremely low limit `successCondition: result[0] < 0.0000001`, the check failed, so the analysis did not approve the canary update. This confirms that the analysis failed.
- the CPU analysis failed.
  `Normal   ScalingReplicaSet     52m   rollouts-controller  Scaled down ReplicaSet ping-pong-rollout-8545dbfbfc (revision 2) from 1 to 0.` This verified that a failed analysis prevents the canary update from proceeding.

- lets verify the success path by adding `successCondition: result[0] < 0.1` in anaysistemplate.yaml again.
- at this stage, our rollout is:

```table
NAME                DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
ping-pong-rollout   1         1                      1           81m
```

- lets apply now:

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/analysistemplate.yaml
```

- and trigger new rollout revision like we did earlier by changing to normal this time as successCondition is less than 0.1 `rollout-test: normal-cpu-threshold`

```sh
kubectl apply -f ex_4.4/ping_pong/manifests/rollout.yaml
```

- after apply we see:

```table
└──⧉ ping-pong-rollout-7c58d44f88           ReplicaSet   ✔ Healthy      92m    stable
      └──□ ping-pong-rollout-7c58d44f88-9zj79  Pod          ✔ Running      92m    ready:1/1
```

```sh
kubectl get analysisruns -n exercises
```

```table
NAME                               STATUS       AGE
ping-pong-rollout-57b457cbd6-3-1   Successful   6m51s
ping-pong-rollout-8545dbfbfc-2-1   Failed       75m
```

- Hence, our revision 3 is Successful. The updated threshold of 0.1 CPU cores allowed the analysis to pass.
