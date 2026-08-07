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

const bgBodyReps = [
  '#000', '#111', '#070b12', '#080f1c', '#08101d', '#0a0c12', '#0a1120', 
  '#0c1018', '#0d1017', '#10192c', '#111520', '#1a2030', '#1c2438', 
  '#1e293b', 'rgba(11,18,32,1)', 'rgba(4,8,15,1)'
];

const glassBgReps = [
  'rgba(4,8,15,0.75)', 'rgba(8,16,29,0.85)', 'rgba(11,18,32,0.65)',
  'rgba(11,18,32,0.97)', 'rgba(15,26,46,0.5)', 'rgba(20,20,20,0.95)',
  'rgba(15,26,46,0.3)'
];

const textSecReps = [
  '#243352', '#7a8fb0', '#94a3b8', '#b8c9df'
];

let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Background replacements
  bgBodyReps.forEach(rep => {
    // Replace hex that is quoted
    const regex1 = new RegExp(`'${rep}'`, 'g');
    const regex2 = new RegExp(`"${rep}"`, 'g');
    content = content.replace(regex1, "'var(--bg-body)'");
    content = content.replace(regex2, '"var(--bg-body)"');
  });

  // Glass bg replacements
  glassBgReps.forEach(rep => {
    // Replace rgba that is quoted, allowing optional spaces
    const cleanRep = rep.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/,/g, ',\\s*');
    const regex1 = new RegExp(`'${cleanRep}'`, 'g');
    const regex2 = new RegExp(`"${cleanRep}"`, 'g');
    content = content.replace(regex1, "'var(--glass-bg)'");
    content = content.replace(regex2, '"var(--glass-bg)"');
  });

  // Text secondary replacements
  textSecReps.forEach(rep => {
    const regex1 = new RegExp(`'${rep}'`, 'g');
    const regex2 = new RegExp(`"${rep}"`, 'g');
    content = content.replace(regex1, "'var(--text-secondary)'");
    content = content.replace(regex2, '"var(--text-secondary)"');
  });

  // Specifically fix Demo tab bar (has #1c2b45 which wasn't in my list before)
  content = content.replace(/'#1c2b45'/g, "'var(--nav-bg)'");
  content = content.replace(/"#1c2b45"/g, '"var(--nav-bg)"');
  
  // Specific fix for Dashboard background which has `#0a1120` but might be set differently
  content = content.replace(/background: '#0a1120'/g, "background: 'var(--bg-body)'");

  // Fix white text
  content = content.replace(/color: '#fff'/g, "color: '#ffffff'");
  content = content.replace(/color: isActive \? '#fff'/g, "color: isActive ? 'var(--bg-body)'");
  
  // Fix rgba(255,255,255,0.xx) borders that are invisible on light mode by mapping to standard borders
  content = content.replace(/'rgba\(255,255,255,0\.05\)'/g, "'var(--glass-border)'");
  content = content.replace(/'rgba\(255,255,255,0\.07\)'/g, "'var(--glass-border)'");
  content = content.replace(/'rgba\(255,255,255,0\.1\)'/g, "'var(--glass-border)'");
  content = content.replace(/'rgba\(255,255,255,0\.2\)'/g, "'var(--glass-border)'");
  content = content.replace(/'rgba\(255,255,255,0\.12\)'/g, "'var(--glass-border)'");

  // Fix linear-gradient backgrounds that use dark colors
  content = content.replace(/background: 'linear-gradient\(180deg, #0B1220 0%, #0c1018 100%\)'/g, "background: 'var(--bg-body)'");
  content = content.replace(/linear-gradient\(180deg, #0B1220 0%, #0c1018 100%\)/g, "var(--bg-body)");
  content = content.replace(/linear-gradient\(135deg, #10192c, #0B1220\)/g, "var(--glass-bg)");
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
    changedFiles++;
  }
}

console.log(`Updated ${changedFiles} files.`);
