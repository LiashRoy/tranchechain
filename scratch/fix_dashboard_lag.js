const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// Update NBFC heading sizes
content = content.replace(/fontWeight: 700, fontSize: '0.8rem', color: '#d4e0ef' }}>\s*NBFC 3/g, "fontWeight: 700, fontSize: '1.05rem', color: '#d4e0ef' }}>\n            NBFC 3");
content = content.replace(/fontSize: '0.65rem', color: '#7a8fb0' }}>\s*Disbursement Console/g, "fontSize: '0.75rem', color: '#7a8fb0' }}>\n            Disbursement Console");

// Update Fintech heading sizes
content = content.replace(/fontWeight: 800, fontSize: '0.78rem', color: '#fbbf24' }}>\s*Fintech Company/g, "fontWeight: 800, fontSize: '1.05rem', color: '#fbbf24' }}>\n            Fintech Company");
content = content.replace(/fontSize: '0.55rem', color: '#7a8fb0' }}>\s*Education Finance/g, "fontSize: '0.75rem', color: '#7a8fb0' }}>\n            Education Finance");

// Update Partner Institute heading sizes
content = content.replace(/fontWeight: 700, fontSize: '0.8rem', color: '#d4e0ef' }}>\s*Partner Institute/g, "fontWeight: 700, fontSize: '1.05rem', color: '#d4e0ef' }}>\n            Partner Institute");
content = content.replace(/fontSize: '0.65rem', color: '#7a8fb0' }}>\s*Finance Office Portal/g, "fontSize: '0.75rem', color: '#7a8fb0' }}>\n            Finance Office Portal");

// Add hardware acceleration to PortalBlock
content = content.replace(/transition: 'border-color 0.4s, background 0.4s',/g, "transition: 'border-color 0.4s, background 0.4s',\n        transform: 'translateZ(0)',\n        willChange: 'transform, box-shadow',");

fs.writeFileSync('src/pages/Dashboard.jsx', content);
