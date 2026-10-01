# Ex_3.9: DBaaS vs DIY

In this exercise, I tried to compare using DBaaS against running my own PostgreSQL database in Kubernetes, which I have done in earlier exercises.

## 1. DBaaS

### Pros

- Google manages most of the database infrastructure, leaving me less maintenance work.
- Backups can be scheduled automatically and there are options to restore from backup.
- High availability can be configured.
- The database is separate from my Kubernetes cluster, so deleting or recreating the cluster does not automatically delete the database.

### Cons

- I have to pay for the Cloud SQL instance, storage, backups, and any additional features I use.
- For small projects like our exercises, the cost maybe higher.
- I still need to manage access, users, permissions, and security.
- I have less control over the underlying infrastructure.

## 2. Running PostgreSQL in Kubernetes (DIY)

### Pros

- I have more control over the PostgreSQL configuration and version.
- I can manage the database using Kubernetes manifests, along with my other applications e.g. pingpong, logoutput at the same time.
- It may cost less for a small project if I can use existing cluster resources.
- I learn more about how databases, persistent storage, and Kubernetes work together.

### Cons

- I am responsible for maintaining PostgreSQL, including upgrades, security, monitoring, troubleshooting and so on.
- I need to arrange backups myself and make sure that restoring them actually works, however, this work we have not done in our exercises.
- A PersistentVolumeClaim helps keep data when a Pod is replaced, but it is not a backup.
- If I want high availability, replication, and automatic failover, there can be lot more complex work involved.

## 3. Comparison

| Issues            | DBaaS                                           | DIY                                                |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- |
| Initial setup     | Create a database instance and configure access | Create PostgreSQL manifests and persistent storage |
| Maintenance       | Google manages                                  | I manage the database myself                       |
| Cost              | Database charges                                | Cluster and persistent storage                     |
| Backups           | Automated                                       | I must set up and test backups                     |
| Recovery          | Managed                                         | Depends on my backup and recovery setup            |
| High availability | Via configuration                               | Requires more setup and maintenance                |
| Control           | Less control over infra                         | More control                                       |

## Conclusion

For me, Cloud SQL seems easier to maintain because Google manages much of the database infrastructure and provides backup and recovery features, though I have not done or tested it myself, yet. Running PostgreSQL in Kubernetes gives me more control and is useful for learning, but I also have more responsibility.

I would consider Cloud SQL for an application where I want to spend less time managing the database. For a learning project, running PostgreSQL in Kubernetes helps me understand persistent storage.

## References:

- [Back up and restore](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/backups)
- [GKE persistent volumes](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/persistent-volumes)
