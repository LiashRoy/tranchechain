const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/SignaturesTab.jsx', 'utf-8');

// Split the file into two parts at Step4
const step4Index = content.indexOf('function Step4({ keys, tranche, sig }) {');
if (step4Index === -1) {
  console.log('Step4 not found');
  process.exit(1);
}

let beforeStep4 = content.substring(0, step4Index);
let step4Code = content.substring(step4Index);

// Apply patches ONLY to step4Code

step4Code = step4Code.replace(
  /const \[shakeKey, setShakeKey\] = useState\(0\)/,
  `const [shakeKey, setShakeKey] = useState(0)
  const [forgeryPhase, setForgeryPhase] = useState('idle') // 'idle' | 'forging' | 'failed'

  const handleForge = () => {
    setForgeryPhase('forging');
    setTimeout(() => setForgeryPhase('failed'), 1200);
  }`
);

step4Code = step4Code.replace(
  /const handleReset = \(\) => \{\s*setEditAmount\(tranche\.amount\)\s*setPhase\('idle'\)\s*\}/,
  `const handleReset = () => {
    setEditAmount(tranche.amount)
    setPhase('idle')
    setForgeryPhase('idle')
  }`
);

step4Code = step4Code.replace(
  /const handleVerify = useCallback\(async \(\) => \{\s*setPhase\('verifying'\)/,
  `const handleVerify = useCallback(async () => {
    setPhase('verifying')
    setForgeryPhase('idle')`
);

step4Code = step4Code.replace(
  /\{phase !== 'idle' && phase !== 'verifying' && \(\s*<button\s*onClick=\{handleReset\}\s*style=\{\{\s*padding: '13px 18px', borderRadius: 11,\s*background: 'transparent',\s*border: '1px solid rgba\(59,140,255,0\.2\)',\s*color: 'var\(--text-secondary\)', fontFamily: 'Manrope, sans-serif',\s*fontWeight: 800, fontSize: '0\.88rem', cursor: 'pointer',\s*\}\}\s*>\s*Reset amount\s*<\/button>\s*\)\}\s*<\/div>/,
  `{phase !== 'idle' && phase !== 'verifying' && (
          <button
            onClick={handleReset}
            style={{
              padding: '13px 18px', borderRadius: 11,
              background: 'transparent',
              border: '1px solid rgba(59,140,255,0.2)',
              color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
            }}
          >Reset amount</button>
        )}
        
        {isActuallyTampered && (
          <motion.button
            whileHover={forgeryPhase === 'idle' ? { scale: 1.02 } : {}}
            whileTap={forgeryPhase === 'idle' ? { scale: 0.98 } : {}}
            onClick={handleForge}
            disabled={forgeryPhase !== 'idle'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 18px', borderRadius: 11, border: 'none',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--color-red)', fontFamily: 'Manrope, sans-serif',
              fontWeight: 800, fontSize: '0.88rem', cursor: forgeryPhase === 'idle' ? 'pointer' : 'wait',
            }}
          >
            {forgeryPhase === 'forging' ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}><Settings size={16} /></motion.span> Forging…</>
            ) : (
              <><ShieldAlert size={16} /> Attempt to Forge New Signature</>
            )}
          </motion.button>
        )}
      </div>
      
      <AnimatePresence>
        {forgeryPhase === 'failed' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '16px 20px', borderRadius: 12,
              background: 'rgba(239,68,68,0.15)',
              border: '2px solid rgba(239,68,68,0.5)',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-red)', flexShrink: 0
              }}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--color-red)', marginBottom: 4 }}>
                  Forging Failed
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Attacker cannot generate a valid P-256 ECDSA signature for the tampered message without NBFC 2's private key. Cryptography, not just hash linking, provides the fundamental mathematical guarantee.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`
);

content = beforeStep4 + step4Code;
fs.writeFileSync('src/pages/demo/SignaturesTab.jsx', content, 'utf-8');
console.log('Fixed SignaturesTab.jsx successfully!');
