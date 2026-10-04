## 3.10. The project, step 18

- rest of the files and yml configurations remain the same as in previous exercises, so there are no changes in them.
- Create a Google Cloud Storage bucket to store backups of our PostgreSQL Todo database.
- Create a Kubernetes CronJob that runs pg_dump once every 24 hours and uploads the backup file to the bucket.
- Verify that the backup file has been uploaded successfully.
- Delete the GKE cluster to check that the backup is stored independently of Kubernetes.
- Recreate the cluster and database, then restore the database from the backup in the bucket.
- Verify that the restored database contains the Todo data from the backup.

## create a Google Cloud Storage bucket

```shell
gcloud storage buckets create gs://dwk-gke-507811-todo-backups \
  --project=dwk-gke-507811 \
  --location=europe-north1 \
  --uniform-bucket-level-access
```

- verify the bucket is created:

```shell
 gcloud storage buckets list \
  --project dwk-gke-507811
```

- the above lists the bucket like this:
  `creation_time: 2026-10-02T08:36:09+0000
default_storage_class: STANDARD
generation: 1790930168858276387
location: EUROPE-NORTH1
location_type: region
metageneration: 1
name: dwk-gke-507811-todo-backups
public_access_prevention: inherited
soft_delete_policy:
  effectiveTime: '2026-10-02T08:36:09.337000+00:00'
  retentionDurationSeconds: '604800'
storage_url: gs://dwk-gke-507811-todo-backups/
uniform_bucket_level_access: true
update_time: 2026-10-02T08:36:09+0000`

## create cluster:

```shell
gcloud container clusters create dwk-cluster \
  --zone=europe-north1-b \
  --cluster-version=1.36 \
  --disk-size=32 \
  --num-nodes=1 \
  --machine-type=e2-small
```

- we now apply the entire configuration directly from the èx_3.10`directory rather than using GitHub workflow.

```shell
kubectl apply -k .
```

- the above command creates the following resources:
  `configmap/todo-app-config created
secret/todo-backend-secret created
service/todo-app-svc created
service/todo-backend-svc created
service/todo-postgres-svc created
persistentvolumeclaim/todo-app-pvc created
deployment.apps/todo-app created
deployment.apps/todo-backend created
statefulset.apps/todo-postgres created
cronjob.batch/todo-generator created`

- but kubectl get pods outputs the following with some todo-generator errors caused by postgres db todos table not existing, so we will crete one.

```table
NAME                            READY   STATUS              RESTARTS   AGE
todo-app-6565fdccdd-pqz8r       1/1     Running             0          86s
todo-backend-5978dc7557-hq4sg   1/1     Running             0          86s
todo-generator-29848860-q54tn   0/1     Error               0          21s
todo-generator-29848860-w4vfh   0/1     Error               0          38s
todo-generator-29848860-xtw5j   0/1     ContainerCreating   0          0s
todo-postgres-0                 1/1     Running             0          86s
```

### create a postgres db:

```shell
kubectl exec -it todo-postgres-0 -- \
  psql -U postgres -c "CREATE TABLE todos (id SERIAL PRIMARY KEY, todo TEXT NOT NULL);"
```

- verify table created:

```shell
kubectl exec -it todo-postgres-0 -- \
  psql -U postgres -c "\dt"
```

- create a temp job:

```shell
kubectl create job --from=cronjob/todo-generator todo-generator-test
```

- then select todo to see entries:

```shell
kubectl exec -it todo-postgres-0 -- \
  psql -U postgres -c "SELECT * FROM todos;"
```

```table
 id |                             todo
----+---------------------------------------------------------------
  1 | Read https://en.wikipedia.org/wiki/Benjamin_Bell_(volleyball)
  2 | Read https://en.wikipedia.org/wiki/Sosale_Garalapury_Sastry
```

- resourses are created and connected well at this point.
- We will not follow service account + key approach but we follow Workload Identity approach because my Google Cloud Organization blocks creating service-account keys.

## create service account for backup

```shell
gcloud iam service-accounts create todo-backup-sa \
  --project=dwk-gke-507811 \
  --display-name="Todo backup storage SA"
```

- Allow todo-backup-sa to create objects or files in Google Cloud Storage:

```shell
gcloud projects add-iam-policy-binding dwk-gke-507811 \
  --role="roles/storage.objectCreator" \
  --member="serviceAccount:todo-backup-sa@dwk-gke-507811.iam.gserviceaccount.com"
```

- Allow todo-backup-sa to view/read objects in GC Storage:

```shell
gcloud projects add-iam-policy-binding dwk-gke-507811 \
  --role="roles/storage.objectViewer" \
  --member="serviceAccount:todo-backup-sa@dwk-gke-507811.iam.gserviceaccount.com"
```

- create the service account key for todo-backup-sa service account:

```sh
gcloud iam service-accounts keys create ~/todo-backup-sa-key.json \
  --iam-account=todo-backup-sa@dwk-gke-507811.iam.gserviceaccount.com
```

- however the above command clearly tells that key creation is not allowed:
  `ERROR: (gcloud.iam.service-accounts.keys.create) FAILED_PRECONDITION: Key creation is not allowed on this service account.`

### enable workload identity for the cluster:

```shell
gcloud container clusters update dwk-cluster \
  --zone=europe-north1-b \
  --project=dwk-gke-507811 \
  --workload-pool=dwk-gke-507811.svc.id.goog
```

- next in order for workloads use the GKE metadata server:

```shell
gcloud container node-pools update default-pool \
  --cluster=dwk-cluster \
  --zone=europe-north1-b \
  --project=dwk-gke-507811 \
  --workload-metadata=GKE_METADATA
```

- by now we have google service account and workload identity enabled for the cluster. Next we will create a Kubernetes service account and bind it to the Google service account.

```sh
kubectl create serviceaccount todo-backup
```

- allow the Kubernetes ServiceAccount to impersonate the Google ServiceAccount:

```sh
gcloud iam service-accounts add-iam-policy-binding \
  todo-backup-sa@dwk-gke-507811.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:dwk-gke-507811.svc.id.goog[default/todo-backup]" \
  --project=dwk-gke-507811
```

- so now a pod using the Kubernetes todo-backup ServiceAccount is allowed to act as the Google todo-backup-sa Service Account.
- we tell the Kubernetes ServiceAccount which Google ServiceAccount it should use:

```shell
kubectl annotate serviceaccount todo-backup \
  iam.gke.io/gcp-service-account=todo-backup-sa@dwk-gke-507811.iam.gserviceaccount.com
```

- check annotation is added:

```shell
kubectl get serviceaccount todo-backup -o yaml
```

- now we create cronjob to backup the database to our bucket. So I will create cronjob.yml in a dedicated directory `todo_backup`.
- The backup CronJob uses a temporary `emptyDir` volume as shared storage inside the Pod. The `pg-dump` container runs `pg_dump` and saves the database backup as `todo-backup.sql` in `/backup`. For separation of concerns, we create a second container that will later use the same shared `/backup` directory to upload the backup file to Google Cloud Storage. The file in `emptyDir` is temporary and only needs to exist while the backup is being created and uploaded.

- after creating cronjob.yml with dump and upload containers, we just dry-run the the cronjob to see if it is valid, without actually creating it:

```shell
kubectl apply --dry-run=client -f todo_backup/cronjob.yml
```

- the above command looks good, so we now add the cronjob to our main kustomization.yaml resources like following, and apply the entire configuration with kustomize command:

```yaml
resources:
  - todo_app
  - todo_backend
  - todo_generator
  - todo_backup
```

- then apply the entire configuration:

```shell
kubectl apply -k .
```

- created resources:
  `configmap/todo-app-config unchanged
secret/todo-backend-secret configured
service/todo-app-svc unchanged
service/todo-backend-svc unchanged
service/todo-postgres-svc unchanged
persistentvolumeclaim/todo-app-pvc unchanged
deployment.apps/todo-app unchanged
deployment.apps/todo-backend unchanged
statefulset.apps/todo-postgres configured
cronjob.batch/todo-db-backup created
cronjob.batch/todo-generator unchanged`

- verify all services are running and our frontend is working, backend, postgres etc.

### create a test job to verify backup cronjob is working:

```shell
kubectl create job --from=cronjob/todo-db-backup todo-db-backup-test
```

`Tested the backup CronJob by creating a one-time Job.
kubectl get job,pod -l job-name=todo-db-backup-test confirmed that the Job completed successfully (1/1) and the Pod finished with Completed status. This shows that the backup workflow ran successfully from start to finish.`

- verify the actual backup file in Google Cloud Storage:

```shell
gcloud storage ls gs://dwk-gke-507811-todo-backups/
```

- above command shows the backup file was uplaoded successfully to the bucket. `gs://dwk-gke-507811-todo-backups/todo-backup-2026-10-03T11-01-10Z.sql`
- lets verify the backup itself by downloading it temporarilly.

```shell
gcloud storage cp \
  gs://dwk-gke-507811-todo-backups/todo-backup-2026-10-03T11-01-10Z.sql \
  /tmp/todo-backup.sql
```

- the above command downloaded the backup file to my local mac's temp directory.
- we can actually see the contents of the backup file where at this point we have 29 wiki links entries.

```shell
grep -A35 "Data for Name: todos" /tmp/todo-backup.sql
```

- also makesure our bucket is safely stored in GCS:

```shell
gcloud storage ls -l gs://dwk-gke-507811-todo-backups/
```

- bucket is safely stored logs of above command:
  `3755  2026-10-03T11:01:16Z  gs://dwk-gke-507811-todo-backups/todo-backup-2026-10-03T11-01-10Z.sql
TOTAL: 1 objects, 3755 bytes (3.67kiB)`

### test that our database backup survives even if the Kubernetes cluster and its database are deleted:

- delete the cluster:

```shell
gcloud container clusters delete dwk-cluster \
  --zone=europe-north1-b \
  --project=dwk-gke-507811
```

- after the cluster is deleted, we can verify that the backup file is still in the bucket:

```shell
gcloud storage ls -l gs://dwk-gke-507811-todo-backups/
```

- output of above command shows the file is existing:
  `3755  2026-10-03T11:01:16Z  gs://dwk-gke-507811-todo-backups/todo-backup-2026-10-03T11-01-10Z.sql
TOTAL: 1 objects, 3755 bytes (3.67kiB)`

## rebuild the cluster:

```shell
gcloud container clusters create dwk-cluster \
  --zone=europe-north1-b \
  --project=dwk-gke-507811 \
  --cluster-version=1.36 \
  --disk-size=32 \
  --num-nodes=1 \
  --machine-type=e2-small
```

- create resources again:

```shell
kubectl apply -k .
```

- to prove there is fresh database:

```shell
kubectl exec todo-postgres-0 -- \
  psql -U postgres -c "\dt"
```

- proves the above: Did not find any relations.
- we will copy the back from mac into the PostgreSQL first:

```shell
kubectl cp /tmp/todo-backup.sql todo-postgres-0:/tmp/todo-backup.sql
```

- resote the backup:

```shell
kubectl exec todo-postgres-0 -- \
  psql -U postgres -f /tmp/todo-backup.sql
```

- lets verify new db contains rows:

```shell
kubectl exec todo-postgres-0 -- \
  psql -U postgres -c "SELECT count(*) FROM todos;"
```

- above prints:

```table
count
-------
   29
```

- thus desaster recovery is successful.
- delete cluster now

```shell
gcloud container clusters delete dwk-cluster \
  --zone=europe-north1-b \
  --project=dwk-gke-507811
```

- delete the backup bucket

```shell
gcloud storage rm --recursive gs://dwk-gke-507811-todo-backups
```

- delete the temporary service account `todo-backup-sa`

```shell
gcloud iam service-accounts delete \
  todo-backup-sa@dwk-gke-507811.iam.gserviceaccount.com \
  --project=dwk-gke-507811
```

- cleanup is done.
