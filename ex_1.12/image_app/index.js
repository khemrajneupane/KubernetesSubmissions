const http = require("http");
const fs = require("fs");
const { stat } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");

const PORT = process.env.PORT || 3000;

const IMAGE_PATH = "/usr/src/app/files/image.jpg";
const IMAGE_URL = "https://picsum.photos/1200";

const TEN_MINUTES = 10 * 60 * 1000;

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
  //console.log(stats);
  const age = Date.now() - stats.mtime.getTime();

  return age < TEN_MINUTES;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
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
