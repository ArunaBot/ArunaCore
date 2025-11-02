const archiver = require('archiver');
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

const distPath = path.resolve(__dirname, '..', '..', 'dist');
const rootPath = path.resolve(distPath, 'root');

const src = path.resolve(__dirname, '..', '..', 'build', 'nodejs');
const dest = path.resolve(rootPath, 'arunacore');

if (fs.existsSync(path.resolve(__dirname, '..', '..', 'dist'))) {
  fs.rmSync(path.resolve(__dirname, '..', '..', 'dist'), { recursive: true, force: true });
}

fs.mkdirSync(path.resolve(rootPath, 'arunacore'), { recursive: true });

const packageJson = require('../../package.json');

packageJson.main = 'arunacore/src/main/start.js';
packageJson.scripts = {
  start: 'node --import=./arunacore/src/main/registerLoader.js arunacore/src/main/start.js',
};

fs.writeFileSync(path.resolve(rootPath, 'package.json'), JSON.stringify(packageJson, null, 2));

fs.cpSync(path.resolve(__dirname, '..', '..', 'package-lock.json'), path.resolve(rootPath, 'package-lock.json'), { force: true, preserveTimestamps: true });

fs.cpSync(src, dest, { recursive: true, force: true, preserveTimestamps: true });

fs.rmSync(path.resolve(rootPath, 'arunacore', 'src', 'tests'), { recursive: true, force: true });

zipDirectory(rootPath, path.resolve(distPath, 'arunacore.zip'));
