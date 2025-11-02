const path = require('path');
const fs = require('fs');

const src = path.resolve(__dirname, '..', 'resources');
const dest = path.resolve(__dirname, '..', '..', 'build', 'nodejs', 'resources');
const srcAPI = path.resolve(__dirname, '..', '..', 'api');
const destAPI = path.resolve(__dirname, '..', '..', 'build', 'nodejs', 'api', 'src', 'resources');

fs.cpSync(src, dest, { recursive: true, force: true, preserveTimestamps: true });


// Also copy ./loader.js to build/nodejs/main/loader.js
const loaderSrc = path.resolve(__dirname, 'loader.js');
const loaderDest = path.resolve(__dirname, '..', '..', 'build', 'nodejs', 'src', 'main', 'loader.js');
fs.cpSync(loaderSrc, loaderDest, { force: true, preserveTimestamps: true });

// Copy registerLoader.js to build/nodejs/src/main/registerLoader.js
const registerLoaderSrc = path.resolve(__dirname, 'registerLoader.js');
const registerLoaderDest = path.resolve(__dirname, '..', '..', 'build', 'nodejs', 'src', 'main', 'registerLoader.js');
fs.cpSync(registerLoaderSrc, registerLoaderDest, { force: true, preserveTimestamps: true });

if (!fs.existsSync(destAPI)) {
  fs.mkdirSync(destAPI, { recursive: true });
}

const apiVersion = fs.readFileSync(path.resolve(srcAPI, 'package.json'), 'utf-8').match(/"version"\s*:\s*"([^"]+)"/)[1];

const versionFilePath = path.resolve(destAPI, 'version.js');
const versionFileContent = fs.readFileSync(versionFilePath, 'utf-8').replace('REPLACE_ME', apiVersion);

fs.writeFileSync(versionFilePath, versionFileContent, 'utf-8');

