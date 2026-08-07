const fs = require('fs');
const file = 'src/pages/demo/SignaturesTab.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/color="var\(--color-red\)"/g, 'color="#ef4444"');
content = content.replace(/color="var\(--color-green\)"/g, 'color="#10b981"');
content = content.replace(/color="var\(--color-teal\)"/g, 'color="#14b8a6"');
content = content.replace(/color="var\(--color-gold\)"/g, 'color="#f59e0b"');

fs.writeFileSync(file, content);
console.log('Fixed CSS variable props in HexCard');
