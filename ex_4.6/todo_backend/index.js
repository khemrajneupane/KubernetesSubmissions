const express = require("express");
const { Pool } = require("pg");
const { connect, StringCodec } = require("nats");

const app = express();
const PORT = process.env.PORT || 3001;

const NATS_URL = process.env.NATS_URL;
const ncPromise = connect({ servers: NATS_URL });
const sc = StringCodec();

async function publishTodoEvent(event) {
  try {
    const nc = await ncPromise;
    nc.publish("todos.events", sc.encode(JSON.stringify(event)));
    console.log("Queued Todo event for publishing:", event.type);
  } catch (error) {
    console.error("Failed to publish Todo event:", error);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
let isHealthy = true;

app.get("/healthz", async (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({ status: "unhealthy" });
  }

  try {
    await pool.query("SELECT 1");

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(500).json({ status: "unhealthy" });
  }
});
app.post("/break", (req, res) => {
  isHealthy = false;

  res.status(200).json({
    status: "broken",
  });
});

app.get("/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, todo, done FROM todos ORDER BY id",
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to get todos:", error);

    res.status(500).send("Failed to get todos");
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { done } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send("Invalid todo ID");
    }

    if (typeof done !== "boolean") {
      return res.status(400).send("Done must be a boolean");
    }

    const result = await pool.query(
      "UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, todo, done",
      [done, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Todo not found");
    }

    await publishTodoEvent({
      type: "todo.updated",
      todo: result.rows[0],
    });

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update todo:", error);

    res.status(500).send("Failed to update todo");
  }
});

app.post("/todos", async (req, res) => {
  try {
    const { todo } = req.body;

    console.log("Received todo request");

    if (!todo) {
      console.log("Todo rejected: empty todo");

      res.status(400).send("Todo is required");
      return;
    }

    if (todo.length > 140) {
      console.log(`Todo rejected: too long (${todo.length} characters)`);

      res.status(400).send("Todo is too long");
      return;
    }

    console.log(`Todo accepted: ${todo}`);

    const result = await pool.query(
      "INSERT INTO todos (todo) VALUES ($1) RETURNING id, todo, done",
      [todo],
    );

    await publishTodoEvent({
      type: "todo.created",
      todo: result.rows[0],
    });

    res.status(201).json({ todo });
  } catch (error) {
    console.error("Failed to create todo:", error);

    res.status(500).send("Failed to create todo");
  }
});

app.listen(PORT, () => {
  console.log(`Todo backend is listening on port ${PORT}`);
});
