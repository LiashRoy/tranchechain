const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.jsx', 'utf8');

// 1. Add missing imports if not already there
if (!content.includes('Database, AlertTriangle, FileText')) {
  content = content.replace(
    "import { FolderSync, ShieldAlert, Clock, Landmark, Link as LinkIcon, Building2, User, BookOpen, GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react'",
    "import { FolderSync, ShieldAlert, Clock, Landmark, Link as LinkIcon, Building2, User, BookOpen, GraduationCap, CheckCircle2, ShieldCheck, Database, AlertTriangle, FileText } from 'lucide-react'"
  );
}

// 2. Add the TraditionalFlowDiagram component right before FlowDiagram
const tradComponent = `
const TRAD_NODES = [
  { id: 'nbfc', label: 'NBFC', sub: 'Siloed Database', icon: <Database size={28} color="#ef4444" />, color: '#ef4444' },
  { id: 'platform', label: 'Fintech Company', sub: 'Spreadsheet / DB', icon: <FileText size={28} color="#f59e0b" />, color: '#f59e0b' },
  { id: 'inst', label: 'Institution', sub: 'Manual Entry', icon: <Building2 size={28} color="#ef4444" />, color: '#ef4444' },
]

function TraditionalFlowDiagram() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref} style={{ overflowX: 'auto', paddingBottom: '8px', opacity: 0.85, marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: '640px', position: 'relative' }}>
        {TRAD_NODES.map((node, i) => (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Node box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.18, duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '16px', background: \`\${node.color}14\`,
                border: \`1.5px dashed \${node.color}50\`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.7rem',
              }}>
                {node.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#9badc8', marginBottom: '3px' }}>{node.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: node.color, opacity: 0.75 }}>{node.sub}</div>
              </div>
            </motion.div>

            {/* Arrow connector */}
            {i < TRAD_NODES.length - 1 && (
              <div style={{ position: 'relative', width: '56px', flexShrink: 0, height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Static line */}
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1.5px', borderBottom: '1.5px dashed rgba(239,68,68,0.3)', transform: 'translateY(-50%)' }} />
                
                {/* Label */}
                <div style={{ position: 'absolute', top: -20, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#ef4444', opacity: 0.8, whiteSpace: 'nowrap' }}>
                  {i === 0 ? 'Email/API' : 'Manual Sync'}
                </div>
                
                {/* Error Pulse */}
                {inView && (
                  <motion.div
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444' }}
                  >
                    <AlertTriangle size={14} />
                  </motion.div>
                )}
                <svg style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 3-6 3" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function FlowDiagram() {
`;

if (!content.includes('TraditionalFlowDiagram() {')) {
  content = content.replace("function FlowDiagram() {", tradComponent);
}

// 3. Update the SECTION 3 render logic
const section3Replace = `
        <ScrollSection delay={0.15}>
          <div className="glass-card" style={{ padding: '44px 32px' }}>
            {/* The Broken Traditional Flow */}
            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  The Problem: Traditional Flow
                </span>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#7a8fb0', margin: '8px 0 0' }}>
                  Data is fragmented. Trust relies on manual emails and reconciliation.
                </p>
              </div>
              <TraditionalFlowDiagram />
            </div>

            {/* The TrancheChain Consensus Flow */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                The Solution: TrancheChain Flow
              </span>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#7a8fb0', margin: '8px 0 0' }}>
                All nodes are synchronized. Digital signatures and hash-chaining guarantee data integrity.
              </p>
            </div>
            <FlowDiagram />
`;

content = content.replace(
  /<ScrollSection delay=\{0\.15\}>\s*<div className="glass-card" style=\{\{ padding: '44px 32px' \}\}>\s*<FlowDiagram \/>/m,
  section3Replace
);

// 4. Update the heading of SECTION 3 to reflect the contrast
content = content.replace(
  `eyebrow="// the flow"\n            title="How a Tranche Travels"`,
  `eyebrow="// the flow"\n            title="Traditional vs TrancheChain Flow"`
);
content = content.replace(
  `sub="From NBFC approval to institution receipt — every hop is signed, hashed, and broadcast to all nodes."`,
  `sub="Compare the fragmented legacy process with our shared ledger architecture powered by digital signatures and hash-chaining."`
);

// Update step descriptions to be strictly about PoW/PoS and digital signatures
content = content.replace(
  "{ step: '03', color: '#a78bfa', title: 'Nodes reach consensus',   desc: 'All ledger-holding nodes accept the block via PoW / PoS.' },",
  "{ step: '03', color: '#a78bfa', title: 'Network Consensus',   desc: 'All ledger-holding nodes accept the block via PoW / PoS.' },"
);


fs.writeFileSync('src/pages/Home.jsx', content);
