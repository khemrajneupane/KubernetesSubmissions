const http = require("http");
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.end("Todo app");
});
server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
