const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/SignaturesTab.jsx', 'utf-8');

// Add forgeryPhase to Step4
let old_step4_state = `function Step4({ keys, tranche, sig }) {
  const [editAmount, setEditAmount] = useState(tranche.amount)
  const [phase, setPhase] = useState('idle') // 'idle' | 'verifying' | 'invalid' | 'valid'
  const [shakeKey, setShakeKey] = useState(0)`;

let new_step4_state = `function Step4({ keys, tranche, sig }) {
  const [editAmount, setEditAmount] = useState(tranche.amount)
  const [phase, setPhase] = useState('idle') // 'idle' | 'verifying' | 'invalid' | 'valid'
  const [forgeryPhase, setForgeryPhase] = useState('idle') // 'idle' | 'forging' | 'failed'
  const [shakeKey, setShakeKey] = useState(0)

  const handleForge = () => {
    setForgeryPhase('forging');
    setTimeout(() => setForgeryPhase('failed'), 1200);
  }`;

content = content.replace(old_step4_state, new_step4_state);

// Reset forgery phase on amount reset
let old_reset = `  const handleReset = () => {
    setEditAmount(tranche.amount)
    setPhase('idle')
  }`;

let new_reset = `  const handleReset = () => {
    setEditAmount(tranche.amount)
    setPhase('idle')
    setForgeryPhase('idle')
  }`;

content = content.replace(old_reset, new_reset);

// Also reset on verifying
let old_verify = `  const handleVerify = useCallback(async () => {
    setPhase('verifying')`;

let new_verify = `  const handleVerify = useCallback(async () => {
    setPhase('verifying')
    setForgeryPhase('idle')`;

content = content.replace(old_verify, new_verify);


// Add forge button and banner
let old_buttons = `        {phase !== 'idle' && phase !== 'verifying' && (
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
      </div>`;

let new_buttons = `        {phase !== 'idle' && phase !== 'verifying' && (
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
      </AnimatePresence>`;

content = content.replace(old_buttons, new_buttons);

fs.writeFileSync('src/pages/demo/SignaturesTab.jsx', content, 'utf-8');
console.log('Patched SignaturesTab.jsx successfully!');
