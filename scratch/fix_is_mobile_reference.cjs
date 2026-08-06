const fs = require('fs');

// Fix HowItWorks.jsx
let howContent = fs.readFileSync('src/pages/HowItWorks.jsx', 'utf8');
howContent = howContent.replace(
  "function SectionShell({ id, children, minH = '100vh' }) {",
  "function SectionShell({ id, children, minH = '100vh' }) {\n  const isMobile = useIsMobile();"
);
howContent = howContent.replace(
  "function Section5() {",
  "function Section5() {\n  const isMobile = useIsMobile();"
);
fs.writeFileSync('src/pages/HowItWorks.jsx', howContent);

// Fix LedgerTab.jsx
let ledgerContent = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');
ledgerContent = ledgerContent.replace(
  "function BlockCard({ block, isLatest, isVisible, onTamper }) {",
  "function BlockCard({ block, isLatest, isVisible, onTamper }) {\n  const isMobile = useIsMobile();"
);
fs.writeFileSync('src/pages/demo/LedgerTab.jsx', ledgerContent);
