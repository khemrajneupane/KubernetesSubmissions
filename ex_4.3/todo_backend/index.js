const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

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
    const result = await pool.query("SELECT todo FROM todos ORDER BY id");

    const todos = result.rows.map((row) => row.todo);

    res.status(200).json(todos);
  } catch (error) {
    console.error("Failed to get todos:", error);

    res.status(500).send("Failed to get todos");
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

    await pool.query("INSERT INTO todos (todo) VALUES ($1)", [todo]);

    res.status(201).json({
      todo,
    });
  } catch (error) {
    console.error("Failed to create todo:", error);

    res.status(500).send("Failed to create todo");
  }
});

app.listen(PORT, () => {
  console.log(`Todo backend is listening on port ${PORT}`);
});
