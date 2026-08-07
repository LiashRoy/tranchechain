const fs = require('fs');
const path = require('path');

const dir = 'src/pages/demo';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx')).map(f => path.join(dir, f));

const replacements = [
  // Card backgrounds (currently hardcoded to very dark grey)
  { from: /'rgba\(15,26,46,0\.72\)'/g, to: "'var(--glass-bg)'" },
  { from: /'rgba\(15,26,46,0\.95\)'/g, to: "'var(--glass-bg)'" },
  { from: /'rgba\(15,26,46,0\.85\)'/g, to: "'var(--glass-bg)'" },
  { from: /'rgba\(15,26,46,0\.4\)'/g, to: "'var(--glass-bg)'" },
  
  // Text colors (low contrast on light background)
  { from: /'#b8c9df'/g, to: "'var(--text-primary)'" },
  { from: /'#243352'/g, to: "'var(--text-secondary)'" },
  
  // Semantic colors to vars (for consistency)
  { from: /'#a78bfa'/g, to: "'var(--color-electric-blue)'" }, // Re-mapping purple to electric blue to simplify
  { from: /'#fbbf24'/g, to: "'var(--color-gold)'" },
  { from: /'#f87171'/g, to: "'var(--color-red)'" },
  { from: /'#ef444490'/g, to: "'var(--badge-red-border)'" },
  { from: /'#ef444460'/g, to: "'var(--badge-red-border)'" },
  { from: /'#6aaeff'/g, to: "'var(--color-electric-blue)'" },
  { from: /'#34d399'/g, to: "'var(--color-green)'" },
  { from: /'#10b98160'/g, to: "'var(--badge-teal-bg)'" },
  
  // Hardcoded white text on buttons
  { from: /color: busy \? btnColor : '#fff'/g, to: "color: busy ? btnColor : 'var(--bg-body)'" },
  { from: /color: current \? '#fff' : '#243352'/g, to: "color: current ? 'var(--bg-body)' : 'var(--text-secondary)'" },
  { from: /color: '#fff'/g, to: "color: '#ffffff'" }, // Hardcode true white for colored buttons
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed hazy colors in', file);
  }
}
