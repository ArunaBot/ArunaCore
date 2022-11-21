const { execSync } = require('child_process');
const bundle = require('../../package.json');
const path = require('path');
const fs = require('fs');

const parts = ['api', 'http', 'websocket'];

delete bundle.devDependencies;

for (const part of parts) {
  const { devDependencies } = require(path.join('..', '..', '..', part, 'package.json'));
  console.log(`Installing ${part}`);
  bundle.devDependencies = { ...bundle.devDependencies, ...devDependencies };
  execSync('npm install --save', { cwd: path.join(__dirname, '..', '..', '..', part), stdio: 'inherit' });
  console.log(`Installed ${part}`);
}

fs.writeFileSync(path.join(__dirname, '..', '..', 'package.json'), JSON.stringify(bundle, null, '\t'), { encoding: 'utf8' });

execSync('npm install --save', { cwd: path.join(__dirname, '..', '..'), stdio: 'inherit' });
