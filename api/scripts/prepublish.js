const fs = require('fs');

const packageRaw = fs.readFileSync('./out/package.json', 'utf8');
const packageJson = JSON.parse(packageRaw);

packageJson.types = 'build/src/index.ts';

fs.writeFileSync('./out/package.json', JSON.stringify(packageJson, null, 2));

fs.copyFileSync('./.npmignore', './out/.npmignore');
fs.copyFileSync('../LICENSE', './out/LICENSE');
fs.copyFileSync('../README.md', './out/README.md');
