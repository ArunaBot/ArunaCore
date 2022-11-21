const { argv } = require('process');
const path = require('path');
const fs = require('fs');

console.log(argv);

var steps = 0;
var current = 0;

const dirs = ['api', 'http', 'websocket', 'bundle'];

var apiVersion = null;

if (!argv.includes('apiVersion') || !argv[argv.indexOf('apiVersion') + 1] || !(/([0-9]\.[0-9]\.[0-9])(-([A-z]*)\.[0-9])?/.test(argv[argv.indexOf('apiVersion') + 1]))) {
  dirs.shift();
} else {
  apiVersion = argv[argv.indexOf('apiVersion') + 1];
}

if ((!argv.includes('version') || !argv[argv.indexOf('version') + 1] || !(/([0-9]\.[0-9]\.[0-9])(-([A-z]*)\.[0-9])?/.test(argv[argv.indexOf('version') + 1]))) && !apiVersion) {
  return console.error('No version specified, skipping version bump.');
}

const version = argv[argv.indexOf('version') + 1];
steps = dirs.length;

dirs.forEach((dir) => {
  console.log(`[${++current}/${steps}] Bumping ${dir}...`);

  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', dir + '/package.json'), 'utf8'));

  if (apiVersion && dir === 'api') {
    pkg.version = apiVersion;
  } else if (version && dir !== 'api') {
    pkg.version = version;
  }

  fs.writeFileSync(path.join(__dirname, '..', '..', '..', dir, 'package.json'), JSON.stringify(pkg, null, '\t'), { encoding: 'utf8' });
});

if (version) console.log('Finished bumping modules to version ' + version);
if (apiVersion) console.log('Finished bumping api to version ' + apiVersion);

console.log('Finished bumping :)');
