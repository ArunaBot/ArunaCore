const { execSync } = require('child_process');
const bundle = require('../../package.json');
const path = require('path');
const fs = require('fs');

const parts = ['api', 'http', 'websocket'];

parts.forEach((a) => {
  const nodeModules = '../' + a + '/node_modules';

  if (fs.existsSync(nodeModules)) {
    fs.rmdirSync(nodeModules, { recursive: true });
    console.log(`Deleted ${nodeModules}!`);
  }
});

for (const part of parts) {
  const { devDependencies } = require(path.join('..', '..', '..', part, 'package.json'));
  console.log(`Installing ${part}`);
  bundle.devDependencies = { ...bundle.devDependencies, ...devDependencies };
  execSync('npm ci', { cwd: path.join(__dirname, '..', '..', '..', part), stdio: 'inherit' });
  console.log(`Installed ${part}`);
}

fs.writeFileSync(path.join(__dirname, '..', '..', 'package.json'), JSON.stringify(bundle, null, '\t'), { encoding: 'utf8' });

execSync('npm ci', { cwd: path.join(__dirname, '..', '..'), stdio: 'inherit' });
