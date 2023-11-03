const path = require('path');
const fs = require('fs');

const src = path.resolve(__dirname, '..', 'resources');
const dest = path.resolve(__dirname, '..', '..', 'build', 'nodejs', 'resources');

fs.cpSync(src, dest, { recursive: true, force: true, preserveTimestamps: true });


// Also copy ./loader.js to build/nodejs/main/loader.js
const loaderSrc = path.resolve(__dirname, 'loader.js');
const loaderDest = path.resolve(__dirname, '..', '..', 'build', 'nodejs', 'src', 'main', 'loader.js');

fs.cpSync(loaderSrc, loaderDest, { force: true, preserveTimestamps: true });
