const path = require('path');
const fs = require('fs');

const version = require('../package.json').version;

const dest = path.resolve(__dirname, '..', 'build', 'src', 'resources');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

const versionFilePath = path.resolve(dest, 'version.js');
const versionFileContent = fs.readFileSync(versionFilePath, 'utf-8').replace('REPLACE_ME', version);

fs.writeFileSync(versionFilePath, versionFileContent, 'utf-8');
