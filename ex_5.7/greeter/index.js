const http = require("http");

const PORT = process.env.PORT || 3000;
const VERSION = process.env.VERSION || "1";

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
    });

    res.end(`Hello from version ${VERSION}`);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Greeter version ${VERSION} started on port ${PORT}`);
});
