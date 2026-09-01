const http = require("http");

const PORT = process.env.PORT || 3001;

const todoItems = [
  "Learn Kubernetes",
  "Understand Services",
  "Build a Todo application",
];

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  response.end(JSON.stringify(data));
}

function handleTodoCreation(request, response) {
  let requestBody = "";

  request.on("data", (part) => {
    requestBody += part;
  });

  request.on("end", () => {
    try {
      const newTodo = JSON.parse(requestBody);

      if (!newTodo.todo) {
        response.writeHead(400, {
          "Content-Type": "text/plain",
        });

        response.end("Todo is required");
        return;
      }

      if (newTodo.todo.length > 140) {
        response.writeHead(400, {
          "Content-Type": "text/plain",
        });

        response.end("Todo is too long");
        return;
      }

      todoItems.push(newTodo.todo);

      sendJson(response, 201, {
        todo: newTodo.todo,
      });
    } catch {
      response.writeHead(400, {
        "Content-Type": "text/plain",
      });

      response.end("Invalid JSON");
    }
  });
}

const app = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/todos") {
    sendJson(response, 200, todoItems);
    return;
  }

  if (request.method === "POST" && request.url === "/todos") {
    handleTodoCreation(request, response);
    return;
  }

  response.writeHead(404, {
    "Content-Type": "text/plain",
  });

  response.end("Not found");
});

app.listen(PORT, () => {
  console.log(`Todo backend is listening on port ${PORT}`);
});
