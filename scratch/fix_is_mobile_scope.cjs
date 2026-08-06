const fs = require('fs');

const files = ['src/pages/HowItWorks.jsx', 'src/pages/demo/LedgerTab.jsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  
  // We will iterate through lines. If a function defines a component (starts with 'function ') 
  // we check if 'isMobile' is used inside its body before the next 'function '.
  // Actually, a simpler way is: for any 'function Foo(' we inject '  const isMobile = useIsMobile();'
  // ONLY if it contains 'isMobile' but doesn't have 'const isMobile =' or 'isMobile =' already inside it.
  
  let newLines = [];
  let currentFuncStart = -1;
  let hasIsMobile = false;
  let hasIsMobileDef = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    
    if (line.match(/^function [A-Z]/) || line.match(/^export default function [A-Z]/) || line.match(/^const [A-Z].*=> {/)) {
      // Start of a component
      // We will blindly inject '  const isMobile = useIsMobile();' right after this line
      // if it's a React component (starts with capital letter) and uses isMobile.
      // Wait, let's just do a string replacement on specific known components.
    }
  }
});
