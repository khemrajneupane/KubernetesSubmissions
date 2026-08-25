const http = require("http");
const crypto = require("crypto");

const randomString = crypto.randomBytes(16).toString("hex");

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    const timestamp = new Date().toISOString();

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`${timestamp}: ${randomString}\n`);
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${randomString}`);
}, 5000);
