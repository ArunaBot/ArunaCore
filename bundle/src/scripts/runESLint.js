const { execSync } = require('child_process');
const path = require('path');

const parts = ['api', 'bundle', 'cli', 'core', 'database', 'http', 'websocket'];

for (const part of parts) {
  console.log(`Running ESLint on ${part}...`);
  execSync('eslint ./src --fix', { cwd: path.join(__dirname, '..', '..', '..', part) });
  console.log(`Finished ESLint execution on ${part}!`);
}
