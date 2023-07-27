/* eslint-disable @typescript-eslint/explicit-function-return-type */
var archiver = require('archiver');
const path = require('path');
const fs = require('fs');

/**
 * @param {String} sourceDir: /some/folder/to/compress
 * @param {String} outPath: /path/to/created.zip
 * @returns {Promise}
 */
function zipDirectory(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

const src = path.resolve(__dirname, '..', '..', 'build', 'nodejs');
const dest = path.resolve(__dirname, '..', '..', 'dist', 'root', 'arunacore');

if (fs.existsSync(path.resolve(__dirname, '..', '..', 'dist'))) {
  fs.rmSync(path.resolve(__dirname, '..', '..', 'dist'), { recursive: true, force: true });
}

fs.mkdirSync(path.resolve(__dirname, '..', '..', 'dist'));
fs.mkdirSync(path.resolve(__dirname, '..', '..', 'dist', 'root'));
fs.mkdirSync(path.resolve(__dirname, '..', '..', 'dist', 'root', 'arunacore'));

const packageJson = require('../../package.json');

packageJson.main = 'arunacore/src/main/start.js';
packageJson.scripts = {
  start: 'node --experimental-specifier-resolution=node arunacore/src/main/start.js',
};

fs.writeFileSync(path.resolve(__dirname, '..', '..', 'dist', 'root', 'package.json'), JSON.stringify(packageJson, null, 2));

fs.cpSync(path.resolve(__dirname, '..', '..', 'package-lock.json'), path.resolve(__dirname, '..', '..', 'dist', 'root', 'package-lock.json'), { force: true, preserveTimestamps: true });

fs.cpSync(src, dest, { recursive: true, force: true, preserveTimestamps: true });

fs.rmSync(path.resolve(__dirname, '..', '..', 'dist', 'root', 'arunacore', 'src', 'tests'), { recursive: true, force: true });

zipDirectory(path.resolve(__dirname, '..', '..', 'dist', 'root'), path.resolve(__dirname, '..', '..', 'dist', 'arunacore.zip'));
