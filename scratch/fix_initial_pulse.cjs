const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

const target = `<motion.div
              animate={{ [isMobile ? 'y' : 'x']: ['-100%', '300%'] }}`;
const replacement = `<motion.div
              initial={{ [isMobile ? 'y' : 'x']: '-100%' }}
              animate={{ [isMobile ? 'y' : 'x']: ['-100%', '300%'] }}`;

content = content.replace(target, replacement);

// There's another thing: AnimatePresence has initial={false} on line 1205.
// Let's remove initial={false} so that the first blocks actually play their entrance animations on mount.
content = content.replace("<AnimatePresence initial={false}>", "<AnimatePresence>");

fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
