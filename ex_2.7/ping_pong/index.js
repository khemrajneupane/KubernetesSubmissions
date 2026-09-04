const http = require("http");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const server = http.createServer(async (req, res) => {
  if (req.url === "/pingpong") {
    try {
      const result = await pool.query(
        "UPDATE counter SET value = value + 1 WHERE id = 1 RETURNING value - 1 AS value",
      );

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`pong ${result.rows[0].value}\n`);
    } catch (error) {
      console.error("Failed to update counter:", error);
      res.writeHead(500);
      res.end("Database error");
    }

    return;
  }

  if (req.url === "/pings") {
    try {
      const result = await pool.query("SELECT value FROM counter WHERE id = 1");

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`${result.rows[0].value}\n`);
    } catch (error) {
      console.error("Failed to get counter:", error);
      res.writeHead(500);
      res.end("Database error");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
