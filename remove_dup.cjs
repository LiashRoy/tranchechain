const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/SignaturesTab.jsx', 'utf-8');

const duplicateBlock = `  const [forgeryPhase, setForgeryPhase] = useState('idle') // 'idle' | 'forging' | 'failed'

  const handleForge = () => {
    setForgeryPhase('forging');
    setTimeout(() => setForgeryPhase('failed'), 1200);
  }`;

// Count occurrences
let count = content.split(duplicateBlock).length - 1;
console.log('Occurrences found:', count);

if (count > 1) {
  // Replace the first occurrence with empty string to remove the duplicate
  content = content.replace(duplicateBlock, '');
  fs.writeFileSync('src/pages/demo/SignaturesTab.jsx', content, 'utf-8');
  console.log('Duplicate removed successfully.');
} else {
  console.log('No duplicates found.');
}
