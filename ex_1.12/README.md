# 1.12. The project, step 6

- create a simple index.js server inside brand new folder: `ex_1.12/image_app`. The server downloads a random image from: `https://picsum.photos/1200` and stores it as a local cached file at this path: **`/usr/src/app/files/image.jpg`**
- for further requests, it serves the cached image if it is less than 10 minutes old else downloads random new one ( for testing, I have initially tried to download and cache the image in current project root and did set 5 seconds only ).

# build image:

```bash
docker build -t image_app:image_app_ex_1.12 ./ex_1.12/image_app
```

# run and test image locally:

```sh
docker run --rm -p 3000:3000 image_app:image_app_ex_1.12
```

# import the image into k3d:

```bash
k3d image import image_app:image_app_ex_1.12 -c k3s-default
```

# create persistentvolume.yaml, persistentvolumeclaim.yaml and apply:

```sh
kubectl apply -f ex_1.12/storage/persistentvolume.yaml
```

```sh
kubectl apply -f ex_1.12/storage/persistentvolumeclaim.yaml
```

# create deployment.yaml inside image_app/manifests and apply it:

```sh
kubectl apply -f ex_1.12/image_app/manifests/deployment.yaml
```

### check pod, pv, pvc, deployment

# test if application can write to PV:

```sh
kubectl exec image-app-5877ff6ffb-lz2bv -- ls -la /usr/src/app/files
```

- make request inside pod:

```sh
kubectl exec image-app-5877ff6ffb-lz2bv -- wget -qO- http://localhost:3000/ > /dev/null
```

- image.jpg is visible

# create service and apply:

```sh
kubectl apply -f ex_1.12/image_app/manifests/service.yaml
```

```sh
kubectl get endpoints image-app-svc
```

# test service with its endpoint: `image-app-svc   10.42.0.32:3000 `:

```sh
kubectl exec image-app-5877ff6ffb-lz2bv -- wget -qO- http://10.42.0.32:3000/ > /dev/null
```

# create ingress and apply:

```sh
kubectl apply -f ex_1.12/image_app/manifests/ingress.yaml
```

# access the image now and test also in 10 min gap:

- first remove log-output-ingress which was running at same indpoint /

```sh
 kubectl delete ingress log-output-ingress
```

- http://localhost:8081/
- works!
