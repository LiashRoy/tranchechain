const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

const statsIdx = content.indexOf('function StatsBar(');
const tamperBannerIdx = content.indexOf('/* ═══════════════════════════════════════════════════════════════════════════\r\n   TAMPER BANNER');

let endIdx = tamperBannerIdx;
if (endIdx === -1) {
  endIdx = content.indexOf('/* ═══════════════════════════════════════════════════════════════════════════\n   TAMPER BANNER');
}

const newStatsBar = `function StatsBar({ blocks, onReset, onRemoveTamper }) {
  const valid   = blocks.filter(b => b.status === 'valid').length
  const broken  = blocks.filter(b => b.status === 'invalid' || b.status === 'tampered').length
  const isClean = broken === 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 20px', borderRadius: 12,
      background: isClean ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
      border: \`1px solid \${isClean ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}\`,
      transition: 'all 0.4s ease',
      flexWrap: 'wrap',
    }}>
      {/* Status dot */}
      <motion.div
        animate={isClean ? {} : { scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
          background: isClean ? '#10b981' : '#ef4444',
          boxShadow: \`0 0 8px \${isClean ? '#10b98180' : '#ef444480'}\`,
          transition: 'background 0.4s, box-shadow 0.4s',
        }}
      />

      {[
        { label: 'Chain Length', value: \`\${blocks.length}\` },
        { label: 'Valid Blocks', value: \`\${valid}\`, color: '#10b981' },
        { label: 'Status', value: isClean ? '✓ Verified' : '⚠ Compromised', color: isClean ? '#10b981' : '#ef4444' },
        { label: 'Verification Time', value: '<12ms', color: '#a78bfa' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#7a8fb0',
          }}>{s.label}:</span>
          <motion.span
            key={s.value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              fontSize: '0.82rem', color: s.color || '#d4e0ef',
            }}
          >{s.value}</motion.span>
        </div>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
        {!isClean && (
          <button
            onClick={onRemoveTamper}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#34d399', fontFamily: 'Manrope, sans-serif',
              fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            Remove Tamper
          </button>
        )}
        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(59,140,255,0.1)',
            border: '1px solid rgba(59,140,255,0.25)',
            color: '#6aaeff', fontFamily: 'Manrope, sans-serif',
            fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,140,255,0.18)'
            e.currentTarget.style.borderColor = 'rgba(59,140,255,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,140,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(59,140,255,0.25)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset Chain
        </button>
      </div>
    </div>
  )
}

`;

content = content.substring(0, statsIdx) + newStatsBar + content.substring(endIdx);
fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
