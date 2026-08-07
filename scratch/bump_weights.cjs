const fs = require('fs');
const path = require('path');

function walk(d) {
  let res=[];
  fs.readdirSync(d).forEach(f=>{
    const file = path.join(d,f);
    if(fs.statSync(file).isDirectory()) res = res.concat(walk(file));
    else if(file.endsWith('.jsx')) res.push(file);
  });
  return res;
}

const files = walk('src');

let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Bump font weights up for legibility (without touching font sizes)
  // 400 -> 500, 500 -> 600, 600 -> 700, 700 -> 800
  content = content.replace(/fontWeight:\s*400/g, "fontWeight: 500");
  content = content.replace(/fontWeight:\s*500/g, "fontWeight: 600");
  content = content.replace(/fontWeight:\s*600/g, "fontWeight: 700");
  content = content.replace(/fontWeight:\s*700/g, "fontWeight: 800");
  
  // Make unweighted text slightly bolder by default if it's explicitly light
  content = content.replace(/fontWeight:\s*300/g, "fontWeight: 400");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Bumped font weight in', file);
    changedFiles++;
  }
}

console.log(`Updated ${changedFiles} files.`);
