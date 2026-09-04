# 2.7. Stateful applications

- this exercise builds on top of [ex_2.5](https://github.com/khemrajneupane/KubernetesSubmissions/tree/2.5/ex_2.5)

# create postgreSQL StatefulSet kind in:

- ex_2.7/ping_pong/manifests/postgres.yaml and add namespace to exercises

# apply postgres statefulset where we have also pod for PostgreSQL Service:

```sh
kubectl apply -f ex_2.7/ping_pong/manifests/postgres.yaml
```

# create another pod instance to connect to postgres:

- the exercise has given way to instantiate a test pod like following
- the following creates a pod `psql-for-debugging`inside the exercise namespace

```sh
kubectl run -it --rm --restart=Never --image=postgres psql-for-debugging -n exercises sh
```

- the above creates a temp pod and runs inside shell.
- now from inside the shell, I can connect to the PSQL:

```bash
psql postgres://postgres:postgres@postgres-svc:5432/postgres
```

- check psql version:

```sh
SELECT version();
```

- PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu,

# create tabel for counter:

- since we want our nodejs processed memory value of `let counter = 0`to be dynamic from database we first create counter table and insert initial value 0:

```sql
CREATE TABLE counter (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL
);
```

- insert initial value 0:

```sql
INSERT INTO counter (value) VALUES (0);
```

- check if value inserted, retrieve counter table:

```sql
SELECT * FROM counter;
```

# connect ping_pong applicatioin to PostgresSQL:

- we need postgresql client in pingpong so that i can directly access the database.
- inside ping_pong we can install this node package:

```sh
npm install pg
```

- installing this package will introduce two more files package-lock.json, node_modules and package.json.
- add node_modules to .gitignore
- refactoring index.js so that it first creates a pool with connection string and /pingpong endpoint will increments the counter value by +1, saves to db and returns original value -1.
- likewise, /pings will simply queries the current count value from the db and sends it.
- the Dockerfile changes now to copy package\*.json to current dir

# build docker image for ping_pong:

```bash
docker build -t ping_pong:ex-2.7 ./ex_2.7/ping_pong
```

# import image ping_pong:ex-2.7 into k3d:

```sh
k3d image import ping_pong:ex-2.7 -c k3s-default
```

### since i used DATABASE_URL as environment in index.js, it should be provided in deployment container as:

```yaml
env:
  - name: DATABASE_URL
    value: "postgres://postgres:postgres@postgres-svc:5432/postgres"
```

# apply deployment:

```sh
kubectl apply -f ex_2.7/ping_pong/manifests/deployment.yaml
```

- check pods, logs and check database url env:

```sh
kubectl get pods -n exercises
kubectl logs -n exercises deployment/ping-pong-deploy
kubectl exec -n exercises deployment/ping-pong-deploy -- printenv DATABASE_URL
```

# call endpoing /pingpong:

- as pingpong is inside cluster, better approach is to port forward temporarilly like:

```sh
kubectl port-forward -n exercises svc/ping-pong-svc 3000:3000
```

- then curl or visit url several times and pong counts increases:

```sh
curl http://localhost:3000/pingpong
```

- veriry the value inside postgresql, by initializing `psql-for-debugging` as before and inisde it sending queries to check counter :

```sh
kubectl run -it --rm --restart=Never --image=postgres psql-for-debugging -n exercises sh
```

```bash
psql postgres://postgres:postgres@postgres-svc:5432/postgres
```

```sql
SELECT * FROM counter;
```

`  postgres=# SELECT * FROM counter;
  id | value
  ----+-------
    1 |     3
  (1 row)`

# lets delete ping-pong pod and see if the counter value is retained:

```sh
kubectl delete pod -n exercises -l app=ping-pong
```

# check log-output also reflects changes:

- visit: http://localhost:8081/
- it works!
