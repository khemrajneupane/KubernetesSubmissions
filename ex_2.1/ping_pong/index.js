const http = require("http");

let counter = 0;
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`pong ${counter}\n`);
    counter++;
    return;
  }

  if (req.url === "/pings") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`${counter}\n`);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
