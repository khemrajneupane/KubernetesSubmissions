const http = require("http");
const fs = require("fs");
const { stat } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");

const PORT = process.env.PORT || 3000;

const IMAGE_PATH = "/usr/src/app/files/image.jpg";
const IMAGE_URL = "https://picsum.photos/1200";

const TEN_MINUTES = 10 * 60 * 1000;

const TODO_BACKEND_URL = "http://todo-backend-svc:3001";

async function downloadImage() {
  const response = await fetch(IMAGE_URL);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const fileWriteStream = fs.createWriteStream(IMAGE_PATH);

  await pipeline(Readable.fromWeb(response.body), fileWriteStream);
}

async function imageIsFresh() {
  if (!fs.existsSync(IMAGE_PATH)) {
    return false;
  }

  const stats = await stat(IMAGE_PATH);

  const age = Date.now() - stats.mtime.getTime();

  return age < TEN_MINUTES;
}

async function getTodos() {
  const response = await fetch(`${TODO_BACKEND_URL}/todos`);

  if (!response.ok) {
    throw new Error(`Todo backend failed: ${response.status}`);
  }

  return await response.json();
}

async function createTodo(todo) {
  const response = await fetch(`${TODO_BACKEND_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      todo: todo,
    }),
  });

  if (!response.ok) {
    throw new Error(`Todo backend failed: ${response.status}`);
  }

  return await response.json();
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      resolve(new URLSearchParams(body));
    });

    req.on("error", reject);
  });
}

function createTodoList(todos) {
  return todos
    .map(
      (todo) => `
        <div style="
          background-color: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          display: flex;
          align-items: center;
          min-height: 56px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          overflow: hidden;
        ">
          <div style="
            width: 6px;
            min-height: 56px;
            background-color: #e1e80a;
            align-self: stretch;
          "></div>

          <p style="
            margin: 0;
            padding: 14px 16px;
            font-size: 16px;
            font-weight: 500;
            color: #000000;
          ">
            ${todo}
          </p>
        </div>
      `,
    )
    .join("");
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/todos") {
    try {
      const formData = await getRequestBody(req);

      const todo = formData.get("todo");

      if (!todo || todo.trim().length === 0) {
        res.writeHead(400, {
          "Content-Type": "text/plain",
        });

        res.end("Todo is required");
        return;
      }

      if (todo.length > 140) {
        res.writeHead(400, {
          "Content-Type": "text/plain",
        });

        res.end("Todo is too long");
        return;
      }

      await createTodo(todo);

      res.writeHead(302, {
        Location: "/",
      });

      res.end();
    } catch (error) {
      console.error("Failed to create todo:", error);

      res.writeHead(500, {
        "Content-Type": "text/plain",
      });

      res.end("Failed to create todo");
    }

    return;
  }

  if (req.method === "GET" && req.url === "/") {
    try {
      const todos = await getTodos();

      const todoList = createTodoList(todos);

      res.writeHead(200, {
        "Content-Type": "text/html",
      });

      res.end(`
<!DOCTYPE html>

<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Todo App</title>
</head>

<body style="
  margin: 0;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f8f9fa;
  color: #212529;
  display: flex;
  flex-direction: column;
  align-items: center;
">



  <h1 style="
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 24px 0;
    text-align: center;
  ">
    Todo App
  </h1>



  <div style="
    margin-bottom: 40px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    width: 320px;
    height: 320px;
  ">

    <img
      src="/image"
      alt="Random Header"
      style="
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      "
    />

  </div>


  <form
    method="POST"
    action="/todos"
    style="
      display: flex;
      gap: 12px;
      width: 100%;
      max-width: 600px;
      margin-bottom: 32px;
    "
  >

    <input
      type="text"
      name="todo"
      placeholder="Enter a new todo (max 140 characters)"
      maxlength="140"
      required
      style="
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e1e80a;
        border-radius: 6px;
        font-size: 16px;
        outline: none;
        box-sizing: border-box;
      "
    />

    <button
      type="submit"
      style="
        padding: 12px 24px;
        background-color: #e1e80a;
        color: #28a745;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      "
    >
      Send
    </button>

  </form>


  <h2 style="
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 20px 0;
    text-align: center;
  ">
    Todos
  </h2>



  <div style="
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  ">

    ${todoList}

  </div>


  <p>
    DevOps with Kubernetes 2026
  </p>

</body>

</html>
      `);
    } catch (error) {
      console.error("Failed to load Todo App:", error);

      res.writeHead(500, {
        "Content-Type": "text/plain",
      });

      res.end("Failed to load Todo App");
    }

    return;
  }

  if (req.method === "GET" && req.url === "/image") {
    try {
      if (!(await imageIsFresh())) {
        console.log("Downloading a new image...");
        await downloadImage();
      } else {
        console.log("Using cached image...");
      }

      res.writeHead(200, {
        "Content-Type": "image/jpeg",
      });

      fs.createReadStream(IMAGE_PATH).pipe(res);
    } catch (error) {
      console.error("Failed to get image:", error);

      res.writeHead(500);

      res.end("Failed to get image");
    }

    return;
  }

  res.writeHead(404);

  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
