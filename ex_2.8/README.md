# 2.8. The project, step 11

- this exercise builds on previous, so resource creation will stay same.

# installing pg client in ex_2.8/todo_backend:

```sh
npm install pg
```

- since I started using node package installing e.g. pg, I would prefer to create my APIs using express package from now on.

```sh
npm install express
```

- the above will create extra packages and node_module files as done in ex_2.7
- we follow the same steps to add node_modules into .gitignore, refacor Dockerfile also. Follow [ex_2.7](https://github.com/khemrajneupane/KubernetesSubmissions/tree/2.7/ex_2.7)

- create postgres.yaml statefulset including todo-postgres-svc, in todo_backend/manifests:

## apply postgres.yaml:

```sh
kubectl apply -f ex_2.8/todo_backend/manifests/postgres.yaml
```

- check pods running in project namespace and make sure todo-postgres is running:

```sh
kubectl get pods -n project
```

- todo-postgres-0 1/1 Running 0 46s
- check volumeclaim is bound:

```sh
kubectl get pvc -n project
```

- todo-app-pvc Bound todo-app-pv 1Gi RWO todo-app-storage <unset>

## create another pod instance to connect to postgres:

- the exercise has given way to instantiate a test pod like following
- the following creates a pod `psql-for-debugging`inside the project namespace

```sh
kubectl run -it --rm --restart=Never --image=postgres psql-for-debugging -n project sh
```

- the above creates a temp pod and runs inside shell.
- now from inside the shell, I can connect to the PSQL:

```bash
psql postgres://postgres:postgres@todo-postgres-svc:5432/postgres
```

- PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu,

# create tabel for todos:

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    todo TEXT NOT NULL
);
```

# populate db with initial todos

```sql
INSERT INTO todos (todo) VALUES
    ('Learn Kubernetes'),
    ('Understand Services'),
    ('Build a Todo application');
```

- check entries:

```sql
SELECT * FROM todos;
```

## create secret.yaml for storing db url

- since db url contains password also so this time I will add (Secret) secret.yaml instead of configmap
- I will use stringData key for DATABASE_URL so that Kubernetes will handle encoding itself for now.
- apply secret:

```sh
kubectl apply -f ex_2.8/todo_backend/manifests/secret.yaml
```

- verify secret:

```sh
kubectl get secret -n project
```

- todo-backend-secret Opaque 1 30s
- Opact type is Kubernetes default encoding technique.

- in order to make backend deployment use the secrets I added the following into the deployment.yaml:

```yaml
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: todo-backend-secret
      key: DATABASE_URL
```

# build docker image for ex_2.8/todo_backend

```sh
docker build -t todo_backend:todo_backend_ex_2.8 ./ex_2.8/todo_backend
```

# import image todo_backend:todo_backend_ex_2.8 into k3d:

```sh
k3d image import todo_backend:todo_backend_ex_2.8 -c k3s-default
```

# apply deployment:

```sh
kubectl apply -f ex_2.8/todo_backend/manifests/deployment.yaml
```

- verify backend pod:

```sh
kubectl get pods -n project
```

```table
NAME                            READY   STATUS    RESTARTS   AGE
psql-for-debugging              1/1     Running   0          43m
todo-app-85565df98f-ttgcg       1/1     Running   0          29h
todo-backend-769f85995f-sf2zf   1/1     Running   0          57s
todo-postgres-0                 1/1     Running   0          50m
```

- check backend logs:

```sh
kubectl logs -n project deployment/todo-backend
```

- Todo backend is listening on port 3001
- verify secret reached the pod:

```sh
kubectl exec -n project deployment/todo-backend -- printenv DATABASE_URL
```

- reached: postgres://postgres:postgres@todo-postgres-svc:5432/postgres
- testing the api directly via port forwarding:

```sh
kubectl port-forward -n project svc/todo-backend-svc 3001:3001
```

- test the todos retrieval from db:

```sh
curl http://localhost:3001/todos
```

- inserting one more todo:

```sh
curl -X POST http://localhost:3001/todos \
  -H "Content-Type: application/json" \
  -d '{"todo":"Learning is fun"}'
```

- adding works
- retrieving all works: curl http://localhost:3001/todos
- to test in frontend via 8081 port there is my previous log_output app is using the port
- so, I would prefer to add host rule for ingress in both log_output and todo_app by adding following to ingress.yaml rules:
- following approach is host-based routing approach.

```yaml
- host: log-output.localhost
```

```yaml
- host: todo-app.localhost
```

- apply both above:

```sh
kubectl apply -f ex_2.7/log_output/manifests/ingress.yaml
```

```sh
kubectl apply -f ex_2.8/todo_app/manifests/ingress.yaml
```

- now they have their dedicated urls:

```table
| URL                                         | Goes to    |
| ------------------------------------------- | ---------- |
| http://log-output.localhost:8081/           | Log Output |
| http://log-output.localhost:8081/pingpong   | Ping-pong  |
| http://todo-app.localhost:8081/             | Todo App   |
```

## remove todo-backend pod and see if the data is persistent:

```bash
kubectl delete pod -n project -l app=todo-backend
```

- Yes, data is persistent!
- this works!
