const { connect, StringCodec } = require("nats");

const NATS_URL =
  process.env.NATS_URL || "nats://my-nats.nats.svc.cluster.local:4222";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const LOG_ONLY = process.env.LOG_ONLY === "true";

const sc = StringCodec();

async function sendToSlack(event) {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error("SLACK_WEBHOOK_URL is not configured");
  }

  const todo = event.todo;

  const text =
    `*Todo event:* ${event.type}\n` +
    `*ID:* ${todo.id}\n` +
    `*Task:* ${todo.todo}\n` +
    `*Done:* ${todo.done}`;

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Slack returned HTTP ${response.status}`);
  }

  console.log("Slack notification sent for Todo event:", event.type);
}

async function start() {
  const nc = await connect({ servers: NATS_URL });

  console.log("Connected to NATS");

  const subscription = nc.subscribe("todos.events", {
    queue: "todo-broadcasters",
  });

  console.log("Listening for Todo events");

  for await (const message of subscription) {
    try {
      const event = JSON.parse(sc.decode(message.data));

      console.log("Received Todo event:", event);

      if (!LOG_ONLY) {
        await sendToSlack(event);
      }
    } catch (error) {
      console.error("Failed to process Todo event:", error.message);
    }
  }
}

start().catch((error) => {
  console.error("Broadcaster failed:", error);
  process.exit(1);
});
