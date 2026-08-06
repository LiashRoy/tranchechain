const fs = require('fs');

const files = [
  { path: 'src/pages/Dashboard.jsx', hookPath: '../hooks/useIsMobile' },
  { path: 'src/pages/About.jsx', hookPath: '../hooks/useIsMobile' },
  { path: 'src/pages/HowItWorks.jsx', hookPath: '../hooks/useIsMobile' },
  { path: 'src/pages/demo/LedgerTab.jsx', hookPath: '../../hooks/useIsMobile' }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf8');
  if (!content.includes('import { useIsMobile }')) {
    const lines = content.split('\n');
    const lastImportIdx = lines.findLastIndex(l => l.startsWith('import '));
    if (lastImportIdx !== -1) {
      lines.splice(lastImportIdx + 1, 0, `import { useIsMobile } from '${f.hookPath}'`);
      fs.writeFileSync(f.path, lines.join('\n'));
      console.log(`Added import to ${f.path}`);
    }
  }
});
