const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');
const startIdx = content.indexOf('function ChainConnector');
const endIdx = content.indexOf('/* ═══════════════════════════════════════════════════════════════════════════\r\n   BLOCK CARD');

let cleanEndIdx = endIdx;
if (cleanEndIdx === -1) {
  cleanEndIdx = content.indexOf('/* ═══════════════════════════════════════════════════════════════════════════\n   BLOCK CARD');
}

const newConnector = `function ChainConnector({ broken, pulsing, isMobile }) {
  const color = broken ? '#ef4444' : '#14b8a6'
  const glow = broken ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.4)'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, [isMobile ? 'height' : 'width']: 0 }}
      animate={{ opacity: 1, scale: 1, [isMobile ? 'height' : 'width']: 48 }}
      exit={{ opacity: 0, scale: 0.8, [isMobile ? 'height' : 'width']: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        width: isMobile ? '100%' : 48,
        height: isMobile ? 48 : 'auto',
        flexShrink: 0,
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: isMobile ? 0 : 70,
      }}
    >
      <motion.div
        animate={broken ? {
          x: isMobile ? 0 : [0, -4, 4, -2, 2, 0],
          y: isMobile ? [0, -4, 4, -2, 2, 0] : 0,
          transition: { duration: 0.4 }
        } : {}}
        style={{
          display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          width: isMobile ? 4 : '100%',
          height: isMobile ? '100%' : 4,
          position: 'relative'
        }}
      >
        {/* The Track */}
        <div style={{
          width: '100%', height: '100%',
          background: broken ? 'rgba(239,68,68,0.2)' : 'rgba(20,184,166,0.2)',
          borderRadius: 2,
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Animated pulse */}
          {!broken && (
            <motion.div
              animate={{ [isMobile ? 'y' : 'x']: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: isMobile ? '100%' : '50%',
                height: isMobile ? '50%' : '100%',
                background: \`linear-gradient(\${isMobile ? '180deg' : '90deg'}, transparent, \${color}, transparent)\`,
                boxShadow: \`0 0 12px \${glow}\`,
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            />
          )}
        </div>

        {/* The Arrow Head */}
        <svg
          width={isMobile ? 16 : 14}
          height={isMobile ? 14 : 16}
          viewBox={isMobile ? "0 0 16 14" : "0 0 14 16"}
          style={{
            position: 'absolute',
            [isMobile ? 'bottom' : 'right']: -4,
            filter: \`drop-shadow(0 0 6px \${glow})\`
          }}
        >
          {isMobile ? (
            <path d="M0 0L8 14L16 0" fill={color} />
          ) : (
            <path d="M0 0L14 8L0 16" fill={color} />
          )}
        </svg>

        {broken && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ position: 'absolute', fontSize: '1.4rem', zIndex: 10 }}
          >💥</motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

`;

content = content.substring(0, startIdx) + newConnector + content.substring(cleanEndIdx);
fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
