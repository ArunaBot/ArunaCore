const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const parts = ["api", "cli", "common", "core", "database", "http", "websocket"];

for (const part of parts) {
  console.log(`Running ESLint on ${part}...`);
  execSync('eslint ./src --fix', { cwd: path.join(__dirname, "..", "..", "..", part) });
  console.log(`Finished ESLint execution on ${part}!`)
}