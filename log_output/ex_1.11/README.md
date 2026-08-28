# 1.11. Persisting data

# create storage in k3d node first of all at /tmp/kube:

```bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
```

# verify the volume:

```bash
docker exec k3d-k3s-default-agent-0 ls -ld /tmp/kube
```

/tmp/kube is there:

- drwxr-xr-x 2 root root 4096 Aug 28 13:46 /tmp/kube

### create a dedicated storage folder and keep the both config inside storage: persistentvolume.yaml and persistentvolumeclaim.yaml

# apply PV:

```bash
kubectl apply -f log_output/ex_1.11/storage/persistentvolume.yaml
```

- check it exists:

```bash
kubectl get pv
```

- shared-pv 1Gi RWO Retain Available shared-storage <unset> 5s

# create storage/persistentvolumeclaim.yaml- PersistentVolumeClaim (PVC) which later can claim PV:

# apply PVC:

```bash
kubectl apply -f log_output/ex_1.11/storage/persistentvolumeclaim.yaml
```

- check it exists:

```bash
kubectl get pvc
```

- shared-pvc Bound shared-pv 1Gi RWO shared-storage <unset>
- make sure kubectl get pv now shows status 'bound'

# create deployment for ping-pong by adding volumes and volumeMounts in deployment.yaml

### apply ping-pong deployment that uses this image- ping-pong:pingpong_ex-1.11:

```bash
kubectl apply -f log_output/ex_1.11/ping_pong/manifests/deployment.yaml
```

# testing volume is actually mounted inside pod, sh inside pod and list directories:

```bash
kubectl exec -it ping-pong-deploy-5b4dfdd9cd-pt9kq -- sh
```

```bash
ls -ld /usr/src/app/files
```

    exists: drwxr-xr-x    2 root     root          4096 Aug 28 13:46 /usr/src/app/files

- write 'Hello Khem' at /usr/src/app/files/test.txt
  echo "Hello Khem" > /usr/src/app/files/test.txt
- read: cat /usr/src/app/files/test.txt
- remove test.txt: rm /usr/src/app/files/test.txt

# create index.js file where counts are saved at /usr/src/app/files/ping_pong.txt

# create docker image:

```bash
docker build -t ping-pong:pingpong_ex-1.11 ./log_output/ex_1.11/ping_pong
```

# import the image into k3d:

```bash
k3d image import ping-pong:pingpong_ex-1.11
```

# apply deployment after image import:

```bash
kubectl apply -f log_output/ex_1.11/ping_pong/manifests/deployment.yaml
```

# curl or wget inside pod ping-pong-deploy-5b4dfdd9cd-pt9kq to few times to test if pong count increases.

```bash
kubectl exec ping-pong-deploy-5b4dfdd9cd-pt9kq -- wget -qO- http://localhost:3000/pingpong
```

# check this file contents: /usr/src/app/files/ping_pong.txt:

```bash
kubectl exec ping-pong-deploy-5b4dfdd9cd-pt9kq -- cat /usr/src/app/files/ping_pong.txt
```

# for log output, create dedicated log_output folder and keep all necessary files folders e.g. index.js, Dockerfile, manifests.

# index.js is modified so that it accepts the contents from the sared volume where ping_pong has written counts:

# build log_output image:

```bash
docker build -t log_output:logoutput_ex-1.11 ./log_output/ex_1.11/log_output
```

# import the image into k3d:

```bash
k3d image import log_output:logoutput_ex-1.11
```

# apply deployment

```bash
kubectl apply -f log_output/ex_1.11/log_output/manifests/deployment.yaml
```

# likewise create service and ingress and apply:

```bash
kubectl apply -f log_output/ex_1.11/log_output/manifests/service.yaml
```

```bash
kubectl apply -f log_output/ex_1.11/log_output/manifests/ingress.yaml
```

# check pods:

```bash
kubectl get pods
```

- log-output-5f4f89658b-d5qlt 1/1 Running 0 2m35s
- ping-pong-deploy-5b4dfdd9cd-pt9kq 1/1 Running 0 4h19m

# check pvc:

```bash
kubectl get pvc
```

- shared-pvc Bound shared-pv 1Gi RWO shared-storage <unset> 5h31m

# check volumes in both pods:

```bash
kubectl exec ping-pong-deploy-5b4dfdd9cd-pt9kq -- cat /usr/src/app/files/ping_pong.txt
```

```bash
kubectl exec log-output-5f4f89658b-d5qlt -- cat /usr/src/app/files/ping_pong.txt
```

# hit the /pingpong endpoint several times to increast the count:

```bash
kubectl exec ping-pong-deploy-5b4dfdd9cd-pt9kq -- wget -qO- http://localhost:3000/pingpong
```

outputs pong **6**

## then check the timestamp+randomstring+count response at http://localhost:8081/

2026-08-28T19:54:30.254Z: dc4d534d49f780518c4be25e3ff20425
Ping / Pongs: **6**

# Hence, both are sharing the same volume
