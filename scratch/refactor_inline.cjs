const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const jsxFiles = walk('src');

const replacements = [
  // Text Colors
  { from: /'#d4e0ef'/g, to: "'var(--text-primary)'" },
  { from: /"#d4e0ef"/g, to: '"var(--text-primary)"' },
  { from: /'#9badc8'/g, to: "'var(--text-secondary)'" },
  { from: /"#9badc8"/g, to: '"var(--text-secondary)"' },
  { from: /'#7a8fb0'/g, to: "'var(--text-secondary)'" },
  { from: /"#7a8fb0"/g, to: '"var(--text-secondary)"' },
  { from: /'#cbd5e1'/g, to: "'var(--text-primary)'" },
  
  // Background Colors
  { from: /'#0B1220'/g, to: "'var(--bg-body)'" },
  { from: /"#0B1220"/g, to: '"var(--bg-body)"' },
  { from: /'#0f172a'/g, to: "'var(--bg-body)'" },
  { from: /'rgba\(15,\s*26,\s*46,\s*0\.6\)'/g, to: "'var(--glass-bg)'" },
  { from: /'rgba\(11,18,32,0\.97\)'/g, to: "'var(--nav-bg)'" },

  // Semantic specific fixes to ensure light mode visibility
  { from: /'#ef4444'/g, to: "'var(--color-red)'" },
  { from: /"#ef4444"/g, to: '"var(--color-red)"' },
  { from: /'#f59e0b'/g, to: "'var(--color-gold)'" },
  { from: /"#f59e0b"/g, to: '"var(--color-gold)"' },
  { from: /'#10b981'/g, to: "'var(--color-green)'" },
  { from: /"#10b981"/g, to: '"var(--color-green)"' },
  { from: /'#14b8a6'/g, to: "'var(--color-teal)'" },
  { from: /"#14b8a6"/g, to: '"var(--color-teal)"' },
  { from: /'#3b8cff'/g, to: "'var(--color-electric-blue)'" },
  { from: /"#3b8cff"/g, to: '"var(--color-electric-blue)"' },
  { from: /'#3b82f6'/g, to: "'var(--color-electric-blue)'" },
  { from: /"#3b82f6"/g, to: '"var(--color-electric-blue)"' },

  // Borders & Accents (Light-mode friendly RGBA)
  { from: /'rgba\(59,140,255,0\.12\)'/g, to: "'var(--badge-blue-bg)'" },
  { from: /'rgba\(59,140,255,0\.08\)'/g, to: "'var(--glass-border)'" },
  { from: /'rgba\(59,140,255,0\.15\)'/g, to: "'var(--nav-border)'" },
  { from: /'rgba\(239,68,68,0\.1\)'/g, to: "'var(--badge-red-border)'" },
  { from: /'rgba\(239,68,68,0\.03\)'/g, to: "'var(--badge-red-bg)'" },
  { from: /'rgba\(16,185,129,0\.1\)'/g, to: "'var(--badge-teal-border)'" },
  
  // Custom tweaks for high contrast
  { from: /background: 'rgba\\(239,68,68,0\\.02\\)'/g, to: "background: 'var(--badge-red-bg)'" },
  { from: /border: '1px solid rgba\\(239,68,68,0\\.08\\)'/g, to: "border: '1px solid var(--badge-red-border)'" },
];

for (const file of jsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }

  // Update specific complex values
  content = content.replace(/boxShadow: '0 0 16px rgba\\(37,99,235,0\\.3\\)'/g, "boxShadow: '0 0 16px var(--glass-shadow)'");
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}
