/* eslint-disable @typescript-eslint/explicit-function-return-type */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { argv } = require('process');

var steps = 2; var i = 0;
if (argv.includes('clean')) steps++;
if (argv.includes('copyonly')) steps--;
const dirs = ['api', 'cli', 'core', 'http', 'websocket', 'bundle'];

const verbose = argv.includes('verbose') || argv.includes('v');

var copyRecursiveSync = function(src, dest) {
  if (verbose) console.log(`cpsync: ${src} -> ${dest}`);
  var exists = fs.existsSync(src);
  if (!exists) {
    console.log(src + ' doesn\'t exist, not copying!');
    return;
  }
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

if (argv.includes('clean')) {
  console.log(`[${++i}/${steps}] Cleaning...`);
  dirs.forEach((a) => {
    var d = '../' + a + '/build';
    var out = '../' + a + '/out';
    if (fs.existsSync(d)) {
      fs.rmdirSync(d, { recursive: true });
      if (verbose) console.log(`Deleted ${d}!`);
    }
    if (fs.existsSync(out)) {
      fs.rmdirSync(out, { recursive: true });
      if (verbose) console.log(`Deleted ${out}!`);
    }
  });
}

console.log(`[${++i}/${steps}] Copying src files...`);

dirs.forEach((a) => {
  if (argv.includes('test')) {
    copyRecursiveSync('../' + a + '/test', 'build/' + a + '/test');
  }
  copyRecursiveSync('../' + a + '/src', 'build/' + a + '/src');
  if (verbose) console.log(`Copied ${'../' + a + '/build'} -> ${'build/' + a + '/src'}!`);
});

if (!argv.includes('copyonly')) {
  console.log(`[${++i}/${steps}] Compiling src files ...`);

  console.log(
    execSync(
      'node "' +
      path.join(__dirname, '..', '..', 'node_modules', 'typescript', 'lib', 'tsc.js') +
      '" -p "' +
      path.join(__dirname, '..', '..') +
      '"',
      {
        cwd: path.join(__dirname, '..', '..'),
        shell: true,
        env: process.env,
        encoding: 'utf8',
      },
    ),
  );
}
