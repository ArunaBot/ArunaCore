const { execSync } = require('child_process');
const bundle = require('../../package.json');
const path = require('path');
const fs = require('fs');

const parts = ['api', 'cli', 'core', 'database', 'http', 'websocket'];

for (const part of parts) {
  const { devDependencies, dependencies } = require(path.join('..', '..', '..', part, 'package.json'));
  console.log(`Installing ${part}`);
  bundle.devDependencies = { ...bundle.devDependencies, ...devDependencies };
  bundle.dependencies = { ...bundle.dependencies, ...dependencies };
  execSync('npm install', { cwd: path.join(__dirname, '..', '..', '..', part) });
  console.log(`Installed ${part}`);
  // delete bundle.dependencies['arunacore-api'];
}

fs.writeFileSync(path.join(__dirname, '..', '..', 'package.json'), JSON.stringify(bundle, null, '\t'), { encoding: 'utf8' });

execSync('npm install', { cwd: path.join(__dirname, '..', '..') });
