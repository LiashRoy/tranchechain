const fs = require('fs');
let c = fs.readFileSync('src/main.jsx', 'utf8');
c += '\nconsole.log("Cache bust version: ' + Date.now() + '");\n';
fs.writeFileSync('src/main.jsx', c);
