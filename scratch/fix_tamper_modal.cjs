const fs = require('fs');

let ledgerContent = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');
ledgerContent = ledgerContent.replace(
  "function TamperModal({ block, onSave, onClose }) {",
  "function TamperModal({ block, onSave, onClose }) {\n  const isMobile = useIsMobile();"
);
fs.writeFileSync('src/pages/demo/LedgerTab.jsx', ledgerContent);
