const fs = require("fs");
const crypto = require("crypto");

const randomString = crypto.randomBytes(16).toString("hex");

setInterval(() => {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp}: ${randomString}\n`;

  fs.appendFileSync("/usr/src/app/files/log.txt", logLine);

  console.log("logLine: ", logLine);
}, 5000);
