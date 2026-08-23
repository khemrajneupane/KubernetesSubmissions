# Chapter 2:

-Process of creating image locally, importing/deploying to kubernetes cluster and outputting logs

## Build image:

`docker build -t log-output:1.0 . `

## Call local image into k8 cluster:

`k3d image import log-output:1.0 `

## Log output app

Deploy with:

`kubectl apply -f log_output/manifests/deployment.yaml`

- deployment.apps/log-output created

## Find pods:

`kubectl get pods`

- log-output-5cb75db87b-lcmdm 1/1 Running 0 13h

## Generate logs: `kubectl logs <pod-name>`

`kubectl logs log-output-5cb75db87b-lcmdm `

## logs:

2026-08-23T07:55:35.029Z: 225614cf1429785bccf854918c4b9d0c

2026-08-23T07:55:40.033Z: 225614cf1429785bccf854918c4b9d0c

2026-08-23T07:55:45.039Z: 225614cf1429785bccf854918c4b9d0c
