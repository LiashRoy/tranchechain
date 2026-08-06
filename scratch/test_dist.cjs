const fs = require('fs');
const path = require('path');
const distFiles = fs.readdirSync('dist/assets');
let found = false;
distFiles.forEach(f => {
  if (f.endsWith('.js')) {
    const content = fs.readFileSync(path.join('dist/assets', f), 'utf8');
    if (content.includes('Traditional Flow')) {
      found = true;
    }
  }
});
console.log('Contains Traditional Flow in dist JS:', found);
