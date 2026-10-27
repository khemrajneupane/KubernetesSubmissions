const WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/Special:Random";
const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL;

async function getRandomWikipediaUrl() {
  const response = await fetch(WIKIPEDIA_URL);

  if (!response.ok) {
    throw new Error(`Wikipedia returned ${response.status}`);
  }

  return response.url;
}

async function createTodo(url) {
  const todo = `Read ${url}`;

  const response = await fetch(`${TODO_BACKEND_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      todo,
    }),
  });

  if (!response.ok) {
    throw new Error(`Todo backend returned ${response.status}`);
  }

  console.log(`Created todo: ${todo}`);
}

async function main() {
  const url = await getRandomWikipediaUrl();

  console.log(`Random Wikipedia URL: ${url}`);

  await createTodo(url);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
