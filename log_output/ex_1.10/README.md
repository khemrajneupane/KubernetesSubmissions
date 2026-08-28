# 1.10. Even more services- logs generator and consumer:

- inside log_output file I created parent ex-1.10 folder and inside which created 2 folders- log_consumer and log_producer.
- added index.js in producer and created simple code which generates random string once in every 5000ms and appends timestamp+random string to a file in dir /usr/src/app/files/log.txt
- first tested if it actually generates outputs and writes to ./log_producer/temp_file/log.txt.
- tested log_consumer reads the contents in temporary file: ./log_producer/temp_files/log.txt
- after testing that log_producer writes logs to temp_files/log.txt and log_consumer is receiving them correctly, I swiched those volume mount path to: /usr/src/app/files/log.txt in both of those files.

# create Dockerfile for bot the containers:

```bash
docker build -t log_producer:producer_1.10 ./log_output/ex_1.10/log_producer
```

```bash
docker build -t log_consumer:consumer_1.10 ./log_output/ex_1.10/log_consumer
```

# import them into k3d

```bash
k3d image import log_consumer:consumer_1.10
```

```bash
k3d image import log_producer:producer_1.10
```

since this deployment is named as 'log-output' and this is already an existing one from previous exercise, I need to delete it first:

```bash
kubectl delete -f log_output/manifests/deployment.yaml
```

## In order to connect those two containers with emptyDir, I created deployment.yaml and applied:

```bash
kubectl apply -f log_output/ex_1.10/manifests/deployment.yaml
```

# important to check the pod has two containers running

```bash
kubectl get pods
```

- log-output-596dbbb4d9-wrzrq 2/2 Running 0 17s

# check output logs of pod-'log-output-596dbbb4d9-wrzrq' running in container -c log-producer and -c log-consumer:

```bash
kubectl logs log-output-596dbbb4d9-wrzrq -c log-producer
kubectl logs log-output-596dbbb4d9-wrzrq -c log-consumer
```

### producer logs:

- logLine: 2026-08-27T19:31:25.191Z: c08cf84cff51b9c485446ddb8989174a
- logLine: 2026-08-27T19:31:30.198Z: c08cf84cff51b9c485446ddb8989174a
- logLine: 2026-08-27T19:31:35.204Z: c08cf84cff51b9c485446ddb8989174a

### consumer logs:

- Server started in port 3000

### however, I can execute command to log contents from inside container also:

```bash
kubectl exec log-output-596dbbb4d9-wrzrq -c log-producer -- cat /usr/src/app/files/log.txt
kubectl exec log-output-596dbbb4d9-wrzrq -c log-consumer -- cat /usr/src/app/files/log.txt
```

### I can also sh into containers to see contents or to test localhost:3000 GET:

```bash
kubectl exec -it log-output-596dbbb4d9-wrzrq -c log-consumer -- sh
```

- then inside WORKDIR: /usr/src/app # wget -qO- http://localhost:3000/

Now the emptyDir is working as expected, we move to creating service and ingress

# create service.yaml:

- define ClusterIP ( optional), port and targetport 3000 and supply correct pod label: "app: log-output"

# apply service:

```bash
kubectl apply -f log_output/ex_1.10/manifests/service.yaml
```

- log-output-svc ClusterIP 10.43.249.29 2345/TCP 2d17h

# create ingress.yaml with GET path / and service name mapped to service's label: log-output :

# apply ingress:

```bash
kubectl apply -f log_output/ex_1.10/manifests/ingress.yaml
```

# finally, checking the get response at localhost from my mac: http://localhost:8081/

kubectl exec log-output-596dbbb4d9-fmqf6 -c log-consumer -- wget -qO- http://localhost:3000/
