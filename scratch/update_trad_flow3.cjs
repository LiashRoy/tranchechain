const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.jsx', 'utf8');

// 1. Add student node to TRAD_NODES
const oldTradNodes = `const TRAD_NODES = [
  { id: 'nbfc', label: 'NBFC', sub: 'Siloed Database', icon: <Database size={28} color="#ef4444" />, color: '#ef4444' },
  { id: 'platform', label: 'Fintech Company', sub: 'Spreadsheet / DB', icon: <FileText size={28} color="#f59e0b" />, color: '#f59e0b' },
  { id: 'inst', label: 'Institution', sub: 'Manual Entry', icon: <Building2 size={28} color="#ef4444" />, color: '#ef4444' },
]`;

const newTradNodes = `const TRAD_NODES = [
  { id: 'nbfc', label: 'NBFC', sub: 'Siloed Database', icon: <Database size={28} color="#ef4444" />, color: '#ef4444' },
  { id: 'platform', label: 'Fintech Company', sub: 'Spreadsheet / DB', icon: <FileText size={28} color="#f59e0b" />, color: '#f59e0b' },
  { id: 'inst', label: 'Institution', sub: 'Manual Entry', icon: <Building2 size={28} color="#ef4444" />, color: '#ef4444' },
  { id: 'student', label: 'Student / Parent', sub: 'Manual App Check', icon: <User size={28} color="#94a3b8" />, color: '#94a3b8' },
]`;

content = content.replace(oldTradNodes, newTradNodes);

// 2. Update Label and Error Pulse in the Arrow Connector
const oldLabel = `{i === 0 ? 'Email/API' : 'Manual Sync'}`;
const newLabel = `{i === 0 ? 'Email/API' : i === 1 ? 'Manual Sync' : 'Wait for Updates'}`;
content = content.replace(oldLabel, newLabel);

const oldPulse = `{inView && (
                  <motion.div
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444' }}
                  >
                    <AlertTriangle size={14} />
                  </motion.div>
                )}`;

const newPulse = `{i === 1 && inView && (
                  <motion.div
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}
                  >
                    <div style={{ background: 'rgba(239,68,68,0.15)', padding: '4px', borderRadius: '50%' }}>
                      <AlertTriangle size={16} fill="rgba(239,68,68,0.3)" />
                    </div>
                    <div style={{ position: 'absolute', top: 26, width: '130px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.55rem', color: '#ef4444', fontWeight: 700, lineHeight: 1.2, background: 'rgba(20,20,20,0.95)', padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 4px 12px rgba(239,68,68,0.15)' }}>
                      ⚠ Double-Disbursement Risk
                    </div>
                  </motion.div>
                )}`;

content = content.replace(oldPulse, newPulse);

// 3. Add Step Breakdown below <TraditionalFlowDiagram />
const oldFlowCall = `<TraditionalFlowDiagram />
            </div>`;

const newFlowCall = `<TraditionalFlowDiagram />
              
              {/* Traditional Flow Step descriptions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(239,68,68,0.1)',
              }}>
                {[
                  { step: '01', color: '#ef4444', title: 'NBFC logs disbursement', desc: "Recorded only in NBFC's internal system" },
                  { step: '02', color: '#f59e0b', title: 'Sent via email/spreadsheet', desc: "No verification the data wasn't altered in transit" },
                  { step: '03', color: '#ef4444', title: 'Institution re-enters manually', desc: "Human error, no cross-check against NBFC's original record" },
                  { step: '04', color: '#94a3b8', title: 'Reconciliation happens later', desc: "Mismatches surface weeks later, or never" },
                ].map(s => (
                  <div key={s.step} style={{ background: \`rgba(239,68,68,0.02)\`, border: \`1px solid rgba(239,68,68,0.08)\`, padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: s.color, marginBottom: '6px' }}>STEP {s.step}</div>
                    <div style={{ fontFamily: 'Manrope', fontSize: '0.75rem', fontWeight: 700, color: '#d4e0ef', marginBottom: '6px' }}>{s.title}</div>
                    <div style={{ fontFamily: 'Manrope', fontSize: '0.7rem', color: '#7a8fb0', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>`;

content = content.replace(oldFlowCall, newFlowCall);

fs.writeFileSync('src/pages/Home.jsx', content);
console.log('Update complete.');
