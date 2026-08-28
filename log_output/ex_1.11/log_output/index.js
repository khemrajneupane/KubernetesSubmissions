const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

const randomString = crypto.randomBytes(16).toString("hex");

const PORT = process.env.PORT || 3000;
const FILE_PATH = "/usr/src/app/files/ping_pong.txt";

setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${randomString}`);
}, 5000);

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    const timestamp = new Date().toISOString();

    let pingPongs = "0";

    try {
      pingPongs = fs.readFileSync(FILE_PATH, "utf8").trim();
    } catch (error) {
      console.log("Could not read ping-pong count:", error.message);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });

    res.end(`${timestamp}: ${randomString}\n` + `Ping / Pongs: ${pingPongs}\n`);
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
