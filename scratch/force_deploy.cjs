const fs = require('fs');
const { execSync } = require('child_process');

let c = fs.readFileSync('src/main.jsx', 'utf8');
c = c.replace(/Cache bust version: \d+/, 'Cache bust version: ' + Date.now());
fs.writeFileSync('src/main.jsx', c);

console.log('Deploying...');
execSync('npm run deploy', { stdio: 'inherit' });
