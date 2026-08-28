const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    const content = fs.readFileSync("/usr/src/app/files/log.txt", "utf8");

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(content);
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
