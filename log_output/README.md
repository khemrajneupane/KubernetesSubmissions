# Log output ( Declarative Approach )

## Chapter 2, ex- 1.3

- generates a random string when it starts and outputs
  the string with a timestamp every 5 seconds.
- deploy via manifests/deployment.yaml declarative approach in local kubernetes cluster.

## Build image

```bash
docker build -t log-output:1.0 .
```

# Import local image into k3d:

```bash
k3d image import log-output:1.0
```

# Deploy using kubernetes manifest:

```bash
kubectl apply -f manifests/deployment.yaml
```

# Check deployments and find pods:

```bash
kubectl get deployments
kubectl get pods
```

# generate logs:

```bash
kubectl logs -f log-output-5cb75db87b-vftw9
```

- 2026-08-23T17:13:44.340Z: 533166bc03d75d78285001662dac902e
- 2026-08-23T17:13:49.346Z: 533166bc03d75d78285001662dac902e
- 2026-08-23T17:13:54.352Z: 533166bc03d75d78285001662dac902e
- 2026-08-23T17:13:59.362Z: 533166bc03d75d78285001662dac902e
