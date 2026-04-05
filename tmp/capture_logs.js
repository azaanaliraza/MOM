const { exec } = require('child_process');
const fs = require('fs');

const child = exec('npx convex logs --history 10', { cwd: process.cwd() });
let output = '';

child.stdout.on('data', (data) => { output += data; });
child.stderr.on('data', (data) => { output += data; });

setTimeout(() => {
  fs.writeFileSync('./tmp/logs.txt', output);
  console.log('Saved logs');
  child.kill();
  process.exit(0);
}, 8000);
