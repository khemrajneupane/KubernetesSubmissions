const http = require("http");
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Todo App Step 5, Ex-1.8</h1>");
  }
});
server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
