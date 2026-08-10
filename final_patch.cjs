const fs = require('fs');

function applyRegexPatch(file, patches) {
  let content = fs.readFileSync(file, 'utf-8');
  for (const { rx, repl, name } of patches) {
    if (!rx.test(content)) {
      console.log('Failed to match: ' + name);
    } else {
      content = content.replace(rx, repl);
      console.log('Matched and replaced: ' + name);
    }
  }
  fs.writeFileSync(file, content, 'utf-8');
}

// ---------------- LedgerTab.jsx ----------------
applyRegexPatch('src/pages/demo/LedgerTab.jsx', [
  {
    name: 'Update AddBlockSidebar handleSubmit',
    rx: /if\s*\(\s*usedMilestones\.has\(form\.milestone\)\s*\)\s*\{\s*setError\('Tranche already disbursed — duplicate rejected\.'\)\s*setShakeKey\(k => k \+ 1\)\s*return\s*\}/,
    repl: `if (usedMilestones.has(form.milestone)) {
      const dupIdx = blocks.find(b => b.milestone === form.milestone).index
      setError('⚠ Milestone already disbursed — duplicate tranche rejected. This loan\\'s \\'' + form.milestone + '\\' tranche was already recorded in Block #' + dupIdx + '.')
      setShakeKey(k => k + 1)
      return
    }`
  },
  {
    name: 'Update milestone options disabled',
    rx: /<option key=\{m\} value=\{m\} disabled=\{usedMilestones\.has\(m\)\}>/g,
    repl: `<option key={m} value={m}>`
  },
  {
    name: 'Add error display in AddBlockSidebar',
    rx: /<AnimatePresence>\s*\{isComputing && \(/,
    repl: `{error && (
            <div style={{ color: 'var(--color-red)', fontSize: '0.75rem', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, lineHeight: 1.4, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <AnimatePresence>
            {isComputing && (`
  },
  {
    name: 'Add sweep state and functions to LedgerTab',
    rx: /export default function LedgerTab\(\{ blocks, setBlocks \}\) \{\s*const \[visibleInvalid, setVisibleInvalid\] = useState\(new Set\(\)\)\s*const \[tamperModal, setTamperModal\] = useState\(null\)/,
    repl: `export default function LedgerTab({ blocks, setBlocks }) {
  const [visibleInvalid, setVisibleInvalid] = useState(new Set())
  const [sweepProgress, setSweepProgress] = useState(-1)
  const sweepInterval = useRef(null)

  const handleVerifySweep = () => {
    setSweepProgress(0)
    if (sweepInterval.current) clearInterval(sweepInterval.current)
    let p = 0
    sweepInterval.current = setInterval(() => {
      p++
      if (p >= blocks.length + 1) {
        clearInterval(sweepInterval.current)
        setTimeout(() => {
          setSweepProgress(-1)
          const isBroken = blocks.some((b, i) => b.status === 'invalid' || b.status === 'tampered' || visibleInvalid.has(i))
          setBannerInfo(isBroken ? { failed: true } : { passed: true })
        }, 800)
      } else {
        setSweepProgress(p)
      }
    }, 150)
  }

  const handleExportJson = () => {
    const exportData = blocks.map(b => ({
      id: b.id,
      index: b.index,
      from: b.from,
      to: b.to,
      amount: b.amount,
      milestone: b.milestone,
      timestamp: b.timestamp,
      prevHash: b.prevHash,
      hash: b.hash,
      wasTampered: b.wasTampered,
      status: b.status
    }))
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tranchechain-ledger-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const [tamperModal, setTamperModal] = useState(null)`
  },
  {
    name: 'Pass them to StatsBar',
    rx: /<StatsBar blocks=\{blocks\} onReset=\{handleReset\} onRemoveTamper=\{handleRemoveTamper\} \/>/,
    repl: `<StatsBar blocks={blocks} onReset={handleReset} onRemoveTamper={handleRemoveTamper} onVerify={handleVerifySweep} onExport={handleExportJson} />`
  },
  {
    name: 'Pass isSweeping to BlockCard',
    rx: /<BlockCard\s*block=\{block\}\s*isNew=\{block\.id === newestId\}\s*visiblyInvalid=\{visibleInvalid\.has\(i\)\}\s*onTamper=\{\(b\) => setTamperModal\(b\)\}\s*\/>/g,
    repl: `<BlockCard
                      block={block}
                      isNew={block.id === newestId}
                      visiblyInvalid={visibleInvalid.has(i)}
                      isSweeping={sweepProgress === i + 1}
                      onTamper={(b) => setTamperModal(b)}
                    />`
  },
  {
    name: 'Add isSweeping to BlockCard component definition',
    rx: /function BlockCard\(\{ block, isNew, visiblyInvalid, onTamper \}\) \{/,
    repl: `function BlockCard({ block, isNew, visiblyInvalid, isSweeping, onTamper }) {`
  },
  {
    name: 'Add pulse effect to BlockCard',
    rx: /\{\/\*\s*Card header\s*\*\/\}/,
    repl: `        {isSweeping && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              background: 'var(--color-teal)', zIndex: 10, pointerEvents: 'none'
            }}
          />
        )}
        {/* Card header */}`
  },
  {
    name: 'Update StatsBar definition to include buttons',
    rx: /function StatsBar\(\{ blocks, onReset, onRemoveTamper \}\) \{/,
    repl: `function StatsBar({ blocks, onReset, onRemoveTamper, onVerify, onExport }) {`
  },
  {
    name: 'Update TamperBanner to show Verify passes/fails',
    rx: /function TamperBanner\(\{ info, onDismiss \}\) \{\s*return \(\s*<motion\.div\s*initial=\{\{ opacity: 0, y: -12 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*exit=\{\{ opacity: 0, y: -12 \}\}/,
    repl: `function TamperBanner({ info, onDismiss }) {
  if (info.passed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>✓</div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: 'var(--color-green)' }}>
              Integrity Check Passed
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              All block hashes align. The cryptographic chain is completely unbroken and mathematically secure.
            </div>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>✕</button>
      </motion.div>
    )
  }
  if (info.failed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>✗</div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: 'var(--color-red)' }}>
              Integrity Check Failed
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              The verification sweep detected tampered blocks or orphaned connections. The chain is compromised.
            </div>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>✕</button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}`
  }
]);

// ---------------- SignaturesTab.jsx ----------------
applyRegexPatch('src/pages/demo/SignaturesTab.jsx', [
  {
    name: 'Add forgeryPhase to Step4 state',
    rx: /function Step4\(\{ keys, tranche, sig \}\) \{\s*const \[editAmount, setEditAmount\] = useState\(tranche\.amount\)\s*const \[phase, setPhase\] = useState\('idle'\) \/\/ 'idle' \| 'verifying' \| 'invalid' \| 'valid'\s*const \[shakeKey, setShakeKey\] = useState\(0\)/,
    repl: `function Step4({ keys, tranche, sig }) {
  const [editAmount, setEditAmount] = useState(tranche.amount)
  const [phase, setPhase] = useState('idle') // 'idle' | 'verifying' | 'invalid' | 'valid'
  const [forgeryPhase, setForgeryPhase] = useState('idle') // 'idle' | 'forging' | 'failed'
  const [shakeKey, setShakeKey] = useState(0)

  const handleForge = () => {
    setForgeryPhase('forging');
    setTimeout(() => setForgeryPhase('failed'), 1200);
  }`
  },
  {
    name: 'Reset forgeryPhase on handleReset',
    rx: /const handleReset = \(\) => \{\s*setEditAmount\(tranche\.amount\)\s*setPhase\('idle'\)\s*\}/,
    repl: `const handleReset = () => {
    setEditAmount(tranche.amount)
    setPhase('idle')
    setForgeryPhase('idle')
  }`
  },
  {
    name: 'Reset forgeryPhase on handleVerify',
    rx: /const handleVerify = useCallback\(async \(\) => \{\s*setPhase\('verifying'\)/,
    repl: `const handleVerify = useCallback(async () => {
    setPhase('verifying')
    setForgeryPhase('idle')`
  },
  {
    name: 'Add Forge button and banner to Step 4',
    rx: /\{phase !== 'idle' && phase !== 'verifying' && \(\s*<button\s*onClick=\{handleReset\}\s*style=\{\{\s*padding: '13px 18px', borderRadius: 11,\s*background: 'transparent',\s*border: '1px solid rgba\(59,140,255,0\.2\)',\s*color: 'var\(--text-secondary\)', fontFamily: 'Manrope, sans-serif',\s*fontWeight: 800, fontSize: '0\.88rem', cursor: 'pointer',\s*\}\}\s*>\s*Reset amount\s*<\/button>\s*\)\}\s*<\/div>/,
    repl: `{phase !== 'idle' && phase !== 'verifying' && (
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
  }
]);
