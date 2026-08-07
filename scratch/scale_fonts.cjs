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

  // Scale up rem-based font sizes by 25%
  content = content.replace(/fontSize:\s*'([0-9.]+)rem'/g, (match, val) => {
    let num = parseFloat(val);
    // Don't scale up massive hero fonts too much, they might break
    if (num > 3) return match; 
    return `fontSize: '${(num * 1.25).toFixed(2)}rem'`;
  });

  // Scale up px-based font sizes
  content = content.replace(/fontSize:\s*([0-9]+),/g, (match, val) => {
    let num = parseInt(val, 10);
    if (num > 48) return match;
    return `fontSize: ${Math.round(num * 1.25)},`;
  });
  
  content = content.replace(/fontSize:\s*'([0-9]+)px'/g, (match, val) => {
    let num = parseInt(val, 10);
    if (num > 48) return match;
    return `fontSize: '${Math.round(num * 1.25)}px'`;
  });

  // Bump font weights up for legibility
  // 400 -> 500, 500 -> 600, 600 -> 700, 700 -> 800
  content = content.replace(/fontWeight:\s*400/g, "fontWeight: 500");
  content = content.replace(/fontWeight:\s*500/g, "fontWeight: 600");
  content = content.replace(/fontWeight:\s*600/g, "fontWeight: 700");
  content = content.replace(/fontWeight:\s*700/g, "fontWeight: 800");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Scaled fonts in', file);
    changedFiles++;
  }
}

// Also check index.css for any base font sizes
let css = fs.readFileSync('src/index.css', 'utf8');
let origCss = css;
css = css.replace(/font-size:\s*([0-9.]+)rem/g, (match, val) => {
  return `font-size: ${(parseFloat(val) * 1.25).toFixed(2)}rem`;
});
css = css.replace(/font-size:\s*([0-9]+)px/g, (match, val) => {
  return `font-size: ${Math.round(parseInt(val, 10) * 1.25)}px`;
});
if (css !== origCss) {
  fs.writeFileSync('src/index.css', css);
  console.log('Scaled fonts in src/index.css');
}

console.log(`Updated ${changedFiles} files.`);
