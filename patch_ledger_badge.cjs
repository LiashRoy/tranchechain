const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

const targetStr = `            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem',
              color: 'var(--color-electric-blue)', fontWeight: 800,
            }}>{isRefund ? block.reason : block.milestone}</div>`;

const replacementStr = targetStr + `
            {block.confirmationRef && (
              <div style={{ 
                marginTop: 4, display: 'inline-block',
                background: 'rgba(16,185,129,0.1)', color: 'var(--color-green)',
                padding: '2px 8px', borderRadius: 12,
                fontSize: '0.65rem', fontWeight: 700,
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
                ✓ Institution confirmed {block.confirmationRef}
              </div>
            )}`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
