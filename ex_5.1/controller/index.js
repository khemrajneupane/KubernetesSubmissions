const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const watch = new k8s.Watch(kc);
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

const GROUP = "stable.dwk";
const VERSION = "v1";
const PLURAL = "dummysites";
const NAMESPACE = process.env.NAMESPACE || "default";

async function downloadWebsite(url) {
  console.log(`Downloading website: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Website returned HTTP ${response.status}`);
  }

  const html = await response.text();

  console.log(`Downloaded ${html.length} characters of HTML`);

  return html;
}

async function createWebsiteConfigMap(name, html) {
  const configMapName = `${name}-html`;

  const configMap = {
    metadata: {
      name: configMapName,
      namespace: NAMESPACE,
    },
    data: {
      "index.html": html,
    },
  };

  try {
    const existing = await coreV1Api.readNamespacedConfigMap({
      name: configMapName,
      namespace: NAMESPACE,
    });

    configMap.metadata.resourceVersion = existing.metadata.resourceVersion;

    await coreV1Api.replaceNamespacedConfigMap({
      name: configMapName,
      namespace: NAMESPACE,
      body: configMap,
    });

    console.log(`Updated ConfigMap: ${configMapName}`);
  } catch (error) {
    if (error.statusCode !== 404 && error.code !== 404) {
      throw error;
    }

    await coreV1Api.createNamespacedConfigMap({
      namespace: NAMESPACE,
      body: configMap,
    });

    console.log(`Created ConfigMap: ${configMapName}`);
  }
}

async function createWebsiteDeployment(name) {
  const deploymentName = `${name}-web`;

  const deployment = {
    metadata: {
      name: deploymentName,
      namespace: NAMESPACE,
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: deploymentName,
        },
      },
      template: {
        metadata: {
          labels: {
            app: deploymentName,
          },
        },
        spec: {
          containers: [
            {
              name: "nginx",
              image: "nginx:alpine",
              ports: [
                {
                  containerPort: 80,
                },
              ],
              volumeMounts: [
                {
                  name: "website-content",
                  mountPath: "/usr/share/nginx/html",
                  readOnly: true,
                },
              ],
            },
          ],
          volumes: [
            {
              name: "website-content",
              configMap: {
                name: `${name}-html`,
              },
            },
          ],
        },
      },
    },
  };

  try {
    const existing = await appsV1Api.readNamespacedDeployment({
      name: deploymentName,
      namespace: NAMESPACE,
    });

    deployment.metadata.resourceVersion = existing.metadata.resourceVersion;

    await appsV1Api.replaceNamespacedDeployment({
      name: deploymentName,
      namespace: NAMESPACE,
      body: deployment,
    });

    console.log(`Updated Deployment: ${deploymentName}`);
  } catch (error) {
    if (error.statusCode !== 404 && error.code !== 404) {
      throw error;
    }

    await appsV1Api.createNamespacedDeployment({
      namespace: NAMESPACE,
      body: deployment,
    });

    console.log(`Created Deployment: ${deploymentName}`);
  }
}

async function createWebsiteService(name) {
  const serviceName = `${name}-svc`;

  const service = {
    metadata: {
      name: serviceName,
      namespace: NAMESPACE,
    },
    spec: {
      selector: {
        app: `${name}-web`,
      },
      ports: [
        {
          port: 80,
          targetPort: 80,
        },
      ],
    },
  };

  try {
    const existing = await coreV1Api.readNamespacedService({
      name: serviceName,
      namespace: NAMESPACE,
    });

    // Preserve the automatically assigned cluster IP.
    service.spec.clusterIP = existing.spec.clusterIP;

    // Preserve any automatically assigned IP family settings.
    if (existing.spec.clusterIPs) {
      service.spec.clusterIPs = existing.spec.clusterIPs;
    }

    service.metadata.resourceVersion = existing.metadata.resourceVersion;

    await coreV1Api.replaceNamespacedService({
      name: serviceName,
      namespace: NAMESPACE,
      body: service,
    });

    console.log(`Updated Service: ${serviceName}`);
  } catch (error) {
    if (error.statusCode !== 404 && error.code !== 404) {
      throw error;
    }

    await coreV1Api.createNamespacedService({
      namespace: NAMESPACE,
      body: service,
    });

    console.log(`Created Service: ${serviceName}`);
  }
}

function startWatch() {
  const path = `/apis/${GROUP}/${VERSION}/namespaces/${NAMESPACE}/${PLURAL}`;

  console.log("Starting DummySite watch...");

  watch.watch(
    path,
    { allowWatchBookmarks: true },
    async (type, object) => {
      if (type !== "ADDED") {
        return;
      }

      const name = object?.metadata?.name;
      const url = object?.spec?.website_url;

      if (!name || !url) {
        console.log("DummySite is missing its name or website_url");
        return;
      }

      console.log(`DummySite name: ${name}`);
      console.log(`Website URL: ${url}`);

      try {
        const html = await downloadWebsite(url);

        await createWebsiteConfigMap(name, html);
        await createWebsiteDeployment(name);
        await createWebsiteService(name);

        console.log(`Successfully created website resources for ${name}`);
      } catch (error) {
        console.error(`Failed to process website ${name}:`, error);
      }
    },
    (error) => {
      if (error) {
        console.error("Watch ended with an error:", error);
      } else {
        console.log("Watch ended normally.");
      }

      console.log("Retrying watch in 3 seconds...");
      setTimeout(startWatch, 3000);
    },
  );
}

console.log("DummySite controller starting...");
console.log(`Watching DummySite resources in namespace: ${NAMESPACE}`);

startWatch();
