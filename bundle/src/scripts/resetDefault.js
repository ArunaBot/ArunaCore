const fs = require('fs');

const dirs = ['api', 'http', 'websocket', 'bundle'];

dirs.forEach((a) => {
  const nodeModules = '../' + a + '/node_modules';
  const d = '../' + a + '/build';
  const out = '../' + a + '/out';

  if (fs.existsSync(d)) {
    fs.rmdirSync(d, { recursive: true });
    console.log(`Deleted ${d}!`);
  }

  if (fs.existsSync(out)) {
    fs.rmdirSync(out, { recursive: true });
    console.log(`Deleted ${out}!`);
  }

  if (fs.existsSync(nodeModules)) {
    fs.rmdirSync(nodeModules, { recursive: true });
    console.log(`Deleted ${nodeModules}!`);
  }
});
