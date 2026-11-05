# ex_5.4. Wikipedia with init and sidecar

- We need to prepare:
  - init container downloads a Wikipedia page and saves it to /usr/share/nginx/html/index.html.This process happens once before the main nginx container starts up.
  - nginx mounts the same volume and serves that HTML file.
  - sidecar also mounts the same volume and periodically downloads another page into it, esp. at a random time between 5min and 15min, it downloads a random wikipage. This is a running container.
- create a deployment.yaml adding initContainer with proper command to sh, agruments that curls wiki and adds the contents to `/usr/share/nginx/html/index.html` and volumeMunts to path `/usr/share/nginx/html`. Sidecar also shares the same volume. In the sidecar container agrs, we explicitly add condition to wait between `300 and 900` seconds and download random wiki from given link as `random.html` that nginx can serve it as webpage.
- lets add service.yaml for the deployment.
- apply both deployment and service:

```sh
kubectl apply -f ex_5.4/manifests/
```

```sh
kubectl get pods -n exercises -l app=wikipedia
```

```table
NAME                         READY   STATUS    RESTARTS   AGE
wikipedia-549fd6dcf5-5mrqh   2/2     Running   0          47s
```

- then check whether the init container successfully saved the page into the shared volume:

```sh
kubectl exec -n exercises wikipedia-549fd6dcf5-5mrqh -c nginx -- ls -lh /usr/share/nginx/html/
```

```table
total 584K
-rw-r--r--    1 root     root      583.0K Nov  5 11:42 index.html
```

- so downloaded and saved to `index.html`
- check the nginx web server and make sure it serves the downloaded page:

```sh
kubectl port-forward -n exercises svc/wikipedia-svc 8085:80
```

- the site is up and running despite it is only serving html contents downloaded without other stylesheets, javascrips, images etc.
- we can check the logs of sidecar and confirm all required installations happening.

```sh
kubectl logs -n exercises deploy/wikipedia -c wikipedia-sidecar
```

```table
fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
(1/9) Installing brotli-libs (1.1.1-r0)
(2/9) Installing c-ares (1.34.9-r0)
(3/9) Installing libunistring (1.2-r0)
(4/9) Installing libidn2 (2.3.7-r0)
(5/9) Installing nghttp2-libs (1.69.0-r0)
(6/9) Installing libpsl (0.21.5-r3)
(7/9) Installing zstd-libs (1.5.6-r2)
(8/9) Installing libcurl (8.14.1-r3)
(9/9) Installing curl (8.14.1-r3)
Executing busybox-1.37.0-r14.trigger
OK: 12 MiB in 24 packages
Next Wikipedia download in 825 seconds
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100 98956    0 98956    0     0   119k      0 --:--:-- --:--:-- --:--:--  119k
Random Wikipedia page downloaded successfully
Next Wikipedia download in 464 seconds
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100 77468    0 77468    0     0  84485      0 --:--:-- --:--:-- --:--:-- 84485
Random Wikipedia page downloaded successfully
Next Wikipedia download in 843 seconds
```

- verify the shared directory has both index.html downloaded by `init container` and random.html by `sidecar`:

```sh
kubectl exec -n exercises deploy/wikipedia -c nginx -- ls -lh /usr/share/nginx/html/
```

```table
total 660K
-rw-r--r--    1 root     root      583.0K Nov  5 11:42 index.html
-rw-r--r--    1 root     root       75.7K Nov  5 12:04 random.html
```

- we can see both files are there. The main page: `http://localhost:8085/index.html`, serves the main content downloaded by initcontainer and also after random condition did meet the `http://localhost:8085/random.html` contents gets changing. This verifies sidecar download is working also.
