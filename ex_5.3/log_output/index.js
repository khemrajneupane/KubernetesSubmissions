const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const PING_PONG_URL = "http://ping-pong-svc:3000/pings";
const GREETER_URL = "http://greeter-svc:3000";
const CONFIG_FILE = "/usr/src/app/config/information.txt";

const randomString = crypto.randomBytes(16).toString("hex");

const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    try {
      const response = await fetch(PING_PONG_URL);

      if (!response.ok) {
        throw new Error(`Ping-pong request failed: ${response.status}`);
      }

      res.writeHead(200);
      res.end("OK");
    } catch (error) {
      console.error("Readiness check failed:", error);

      res.writeHead(500);
      res.end("Ping-pong unavailable");
    }

    return;
  }

  if (req.url === "/" || req.url === "/status") {
    try {
      const pingResponse = await fetch(PING_PONG_URL);

      if (!pingResponse.ok) {
        throw new Error(`Ping-pong request failed: ${pingResponse.status}`);
      }

      const pongs = await pingResponse.text();

      const greeterResponse = await fetch(GREETER_URL);

      if (!greeterResponse.ok) {
        throw new Error(`Greeter request failed: ${greeterResponse.status}`);
      }

      const greeting = await greeterResponse.text();

      const fileContent = fs.readFileSync(CONFIG_FILE, "utf8").trim();
      const message = process.env.MESSAGE;
      const timestamp = new Date().toISOString();

      res.writeHead(200, {
        "Content-Type": "text/plain",
      });

      res.end(
        `file content: ${fileContent}\n` +
          `env variable: MESSAGE=${message}\n` +
          `${timestamp}: ${randomString}.\n` +
          `Ping / Pongs: ${pongs}\n` +
          `greetings: ${greeting}\n`,
      );
    } catch (error) {
      console.error("Failed to get status:", error);

      res.writeHead(500);
      res.end("Failed to get status");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
