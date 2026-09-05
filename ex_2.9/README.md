# 2.9 The project, step 12

This exercise adds a Kubernetes CronJob that runs hourly, retrieves a random Wikipedia article URL, and creates a Todo reminder in the existing Todo application using the Todo backend API. The generated Todo is persisted in the existing PostgreSQL database.

- - create a dedicated todo_generator folder inside this exercise folder, i.e. 'ex_2.9', with necessary index.js, Dockerfile etc
- idea in the index.js is to create function that reads location header from 'Wikipedia Special:Random' generated random URL and post the URL in the format ''Read URL' as required by this exercise.
- toto_generator index uses const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL that refers to the todo_backend which is not accessible outside to mac now so temporarilly I port-forward so that local testing can be tested.

```sh
kubectl port-forward -n project svc/todo-backend-svc 3001:3001
```

- after port-forward it can be accessed from my local computer and test post.

```sh
TODO_BACKEND_URL=http://localhost:3001 node ex_2.9/todo_generator/index.js
```

- the above saves todo in db that i can verify visiting this url: http://todo-app.localhost:8081/
- then add a Dockerfile to run todo_generator/index.js so that kubernetes can run it and we can test from there instead of my local computer test.

# build dockerimage and import into k3d:

```sh
docker build -t todo-generator:ex-2.9 ./ex_2.9/todo_generator
```

```sh
k3d image import todo-generator:ex-2.9 -c k3s-default
```

- check image:

```sh
docker images | grep todo-generator
```

# create kubernetes one time job which will consequently be replaced by cronjob later.

- for logic testing, i will create job.yaml just to run the job one time only.
- I will add one more dedicated folder: ex_2.9/todo_generator/manifests/job.yaml
- this job is also under project namespace like all others manifests running into this namespace in this exercise.
- also provide exact generator image: image: todo-generator:ex-2.9

# apply the job:

```sh
kubectl apply -f ex_2.9/todo_generator/manifests/job.yaml
```

- check the job pod and its logs:

```sh
kubectl get jobs -n project
```

```sh
kubectl logs -n project todo-generator-nf2g4
```

- ```kubectl logs -n project todo-generator-nf2g4
  Random Wikipedia URL: https://en.wikipedia.org/wiki/Tunart
  Created todo: Read https://en.wikipedia.org/wiki/Tunart
  ```

## so far all tests good, now I go ahead and create cronjob.yaml that will actually run the job every hour.

- create a cronjob.yaml same way like job.yaml but adding cronjob specific scheduler:
  `schedule: "0 * * * *"`and `jobTemplate`

## apply cronjob.yaml:

```sh
kubectl apply -f ex_2.9/todo_generator/manifests/cronjob.yaml
```

```sh
kubectl get cronjob -n project
```

```table
NAME             SCHEDULE    TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
todo-generator   0 * * * *   <none>     False     0        <none>          21s
```

## manually trigger a scheduled task right now without waiting 1hr:

- from existing todo-generator, create manual one todo-generator-manual to run once:

```sh
kubectl create job --from=cronjob/todo-generator todo-generator-manual -n project
```

- check jobs:

```sh
kubectl get jobs -n project
```

- find the pod created by that job:

```sh
get pods -n project
```

`todo-generator-manual-5dj6m     0/1     Completed   0          60s`

- check logs also:

```sh
kubectl logs -n project todo-generator-manual-5dj6m
```

- Random Wikipedia URL: https://en.wikipedia.org/wiki/Portugu%C3%AAs_(cigarette)
- Created todo: Read https://en.wikipedia.org/wiki/Portugu%C3%AAs_(cigarette)

### instead of manual cronjob todo-generator-manual, i can send command to run if every 1 min instead for tast testing.

```sh
kubectl patch cronjob todo-generator -n project --patch '{"spec":{"schedule":"*/1 * * * *"}}'
```

- test:

```sh
kubectl get cronjob todo-generator -n project
```

- `todo-generator   */1 * * * *   <none>     False     0        49s             17m`
- again, restore 1 hr back:

```sh
kubectl patch cronjob todo-generator -n project --patch '{"spec":{"schedule":"0 * * * *"}}'
```

- since the cronjob will continue running and adding entries to postgresql and soon my space will be occupied, I can keep the CronJob configuration but prevents it from creating new Jobs:

```sh
kubectl patch cronjob todo-generator -n project --patch '{"spec":{"suspend":true}}'
```

- now suspended true:

```table
NAME             SCHEDULE    TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
todo-generator   0 * * * *   <none>     True      0        4m50s           23m
```

- all works!
