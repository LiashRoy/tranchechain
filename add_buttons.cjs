const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf-8');

// Find the exact spot: after "Reset Chain</button>" and before "</div></div>"
const target = `          Reset Chain\r\n        </button>\r\n      </div>`;
const targetLF = `          Reset Chain\n        </button>\n      </div>`;

const verifyBtn = `
        <button
          onClick={onVerify}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            color: 'var(--color-green)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(16,185,129,0.18)'
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Verify Full Chain
        </button>`;

const exportBtn = `
        <button
          onClick={onExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--text-primary)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export JSON
        </button>`;

const NL = content.includes(target) ? '\r\n' : '\n';
const actualTarget = content.includes(target) ? target : targetLF;

if (content.includes(actualTarget)) {
  const replacement = actualTarget.replace('</button>\r\n      </div>', '</button>' + verifyBtn + exportBtn + '\r\n      </div>')
    .replace('</button>\n      </div>', '</button>' + verifyBtn + exportBtn + '\n      </div>');
  content = content.replace(actualTarget, replacement);
  console.log('Inserted Verify + Export buttons successfully!');
} else {
  console.log('Target not found!');
  // Try regex
  const rx = /Reset Chain\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\s*\}/;
  if (rx.test(content)) {
    console.log('Found via regex, inserting...');
    content = content.replace(rx, (match) => {
      return match.replace(/<\/button>\s*<\/div>/, '</button>' + verifyBtn + exportBtn + '\n      </div>');
    });
    console.log('Done!');
  } else {
    console.log('Regex also failed!');
  }
}

fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content, 'utf-8');
