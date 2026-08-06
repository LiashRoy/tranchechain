const fs = require('fs');
let content = fs.readFileSync('src/utils/chain.js', 'utf8');
content = content.replace("return { ...b, hash: computeHash(b), status: 'valid', wasTampered: false, id: uid() }", "return { ...b, originalAmount: b.amount, hash: computeHash(b), status: 'valid', wasTampered: false, id: uid() }");
fs.writeFileSync('src/utils/chain.js', content);
