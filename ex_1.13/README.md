# 1.13. The project, step 7

- basically, this exercise builds on top of previous [ex_1.12](https://github.com/khemrajneupane/KubernetesSubmissions/blob/1.12/ex_1.12/README.md) which i named as image-app. Hence the underlying resources I am using for this exercise 1.13 will be the same as previous.
- I am refactoring the index.js file to accomodate the form input, headers, image, paragraph, button etc.
- I will create a separate image tagged: **todo_app_ex_1.13**
- I will change all the instances of image app to be todo app elsewhere.
- Then re apply all.

# build image:

```bash
docker build -t todo_app:todo_app_ex_1.13 ./ex_1.13/todo_app
```

# run and test image locally:

```sh
docker run --rm -p 3000:3000 todo_app:todo_app_ex_1.13
```

# import the image into k3d:

```bash
k3d image import todo_app:todo_app_ex_1.13 -c k3s-default
```

# create persistentvolume.yaml, persistentvolumeclaim.yaml and apply:

```sh
kubectl apply -f ex_1.13/storage/persistentvolume.yaml
```

```sh
kubectl apply -f ex_1.13/storage/persistentvolumeclaim.yaml
```

# create deployment.yaml inside todo_app/manifests and apply it:

```sh
kubectl apply -f ex_1.13/todo_app/manifests/deployment.yaml
```

### check pod, pv, pvc, deployment

# test if application can write to PV:

```sh
kubectl exec todo-app-d54b68678-xdfvm -- ls -la /usr/src/app/files
```

- make request inside pod and see all html appears:

```sh
kubectl exec todo-app-d54b68678-xdfvm -- wget -qO- http://localhost:3000/
```

# create service and apply:

```sh
kubectl apply -f ex_1.13/todo_app/manifests/service.yaml
```

```sh
kubectl get endpoints todo-app-svc
```

# test service with its endpoint: `todo-app-svc   10.42.0.33:3000 `:

```sh
kubectl exec todo-app-d54b68678-xdfvm -- wget -qO- http://10.42.0.33:3000/
```

# create ingress and apply:

```sh
kubectl apply -f ex_1.13/todo_app/manifests/ingress.yaml
```

# access the image now and test also in 10 min gap:

- http://localhost:8081/
- optionally, for testing, I can copy the image over to my local folder:

```sh
docker cp k3d-k3s-default-agent-0:/tmp/kube/image.jpg ./image-from-pv.jpg
```
