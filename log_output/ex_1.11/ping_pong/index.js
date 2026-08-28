const http = require("http");
const fs = require("fs");

let counter = 0;
const PORT = process.env.PORT || 3000;
const FILE_PATH = "/usr/src/app/files/ping_pong.txt";

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
    counter++;

    fs.writeFileSync(FILE_PATH, counter.toString());

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`pong ${counter}\n`);
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
