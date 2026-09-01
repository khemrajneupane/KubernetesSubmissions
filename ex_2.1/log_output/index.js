const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PING_PONG_URL = "http://ping-pong-svc:3000/pings";

const randomString = crypto.randomBytes(16).toString("hex");
const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    try {
      const response = await fetch(PING_PONG_URL);

      if (!response.ok) {
        throw new Error(`Ping-pong request failed: ${response.status}`);
      }

      const pongs = await response.text();

      const timestamp = new Date().toISOString();

      res.writeHead(200, {
        "Content-Type": "text/plain",
      });

      res.end(`${timestamp}: ${randomString}.\n` + `Ping / Pongs: ${pongs}`);
    } catch (error) {
      console.error("Failed to get ping-pong count:", error);

      res.writeHead(500);
      res.end("Failed to get ping-pong count");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
