# 2.5. Documentation and ConfigMaps

- rest of the resource creations remain the same as done in [ex_2.3](https://github.com/khemrajneupane/KubernetesSubmissions/blob/2.3/ex_2.3/README.md) hence, the original READMD contents are available in the lower part of this page.
- additionally, I will add configmap.yaml inside exercise namespace ( to continue where this ex was done earier ), add necessary data and in the deployment container I will use this env data.
- I will re-create docker images, import into k3d, apply deployments, services, ingress etc, again.

# create configmap.yaml with following data and apply:

```yaml
data:
  information.txt: |
    this text is from file

  MESSAGE: "hello world"
```

## apply configmap:

```sh
kubectl apply -f ex_2.5/log_output/manifests/configmap.yaml
```

- since this is inside `-n exercise`namespace, we can get configmap like so:

```sh
kubectl get configmap -n exercises
```

## add environments in existing deployment.yaml to point to the configmap

- add volumes at the Pod level, plus envFrom and volumeMounts inside the container.
- refactor log_output/index.js to get the output as shown in the exercise

# build docker image for log output:

```sh
docker build -t log-output:ex-2.5 ./ex_2.5/log_output
```

- check image:

```sh
docker images | grep log-output
```

## import logoutput image into k3d:

```bash
k3d image import log-output:ex-2.5 -c k3s-default
```

# create deployment for logoutput and apply:

```sh
kubectl apply -f ex_2.5/log_output/manifests/deployment.yaml

```

### test communication with pods.

- from log output pod accessing to information.txt file and env variable MESSAGE:

```sh
kubectl exec -n exercises -it log-output-76bcfdbfb4-jts7s -- cat /usr/src/app/config/information.txt
```

```sh
kubectl exec -n exercises log-output-76bcfdbfb4-jts7s -- printenv MESSAGE
```

### test logs output itself:

```sh
kubectl exec -n exercises -it log-output-76bcfdbfb4-jts7s -- wget -qO- http://localhost:3000
```

- early existing service and ingress will work no need to modify or re-apply them.

http://localhost:8081/ and http://localhost:8081/pingpong
