const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf-8');

// 1. Update AddBlockSidebar handleSubmit
let old_submit = `    if (usedMilestones.has(form.milestone)) {
      setError('Tranche already disbursed — duplicate rejected.')
      setShakeKey(k => k + 1)
      return
    }`;
let new_submit = `    if (usedMilestones.has(form.milestone)) {
      const dupIdx = blocks.find(b => b.milestone === form.milestone).index
      setError('⚠ Milestone already disbursed — duplicate tranche rejected. This loan\\'s \\'' + form.milestone + '\\' tranche was already recorded in Block #' + dupIdx + '.')
      setShakeKey(k => k + 1)
      return
    }`;
content = content.replace(old_submit, new_submit);

// 2. Update milestone options disabled
let old_option = `<option key={m} value={m} disabled={usedMilestones.has(m)}>`;
let new_option = `<option key={m} value={m}>`;
content = content.replace(old_option, new_option);

// 3. Add error display in AddBlockSidebar
let old_button = `          <AnimatePresence>
            {isComputing && (`;
let new_button = `          {error && (
            <div style={{ color: 'var(--color-red)', fontSize: '0.75rem', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, lineHeight: 1.4, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <AnimatePresence>
            {isComputing && (`;
content = content.replace(old_button, new_button);

// 4. Add sweep state and functions to LedgerTab
let old_ledger_state = `export default function LedgerTab({ blocks, setBlocks }) {
  const [visibleInvalid, setVisibleInvalid] = useState(new Set())
  const [tamperModal, setTamperModal] = useState(null)`;
let new_ledger_state = `export default function LedgerTab({ blocks, setBlocks }) {
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

  const [tamperModal, setTamperModal] = useState(null)`;
content = content.replace(old_ledger_state, new_ledger_state);

// 5. Pass them to StatsBar
let old_statsbar_call = `<StatsBar blocks={blocks} onReset={handleReset} onRemoveTamper={handleRemoveTamper} />`;
let new_statsbar_call = `<StatsBar blocks={blocks} onReset={handleReset} onRemoveTamper={handleRemoveTamper} onVerify={handleVerifySweep} onExport={handleExportJson} />`;
content = content.replace(old_statsbar_call, new_statsbar_call);

// 6. Pass isSweeping to BlockCard
let old_blockcard = `<BlockCard
                      block={block}
                      isNew={block.id === newestId}
                      visiblyInvalid={visibleInvalid.has(i)}
                      onTamper={(b) => setTamperModal(b)}
                    />`;
let new_blockcard = `<BlockCard
                      block={block}
                      isNew={block.id === newestId}
                      visiblyInvalid={visibleInvalid.has(i)}
                      isSweeping={sweepProgress === i + 1}
                      onTamper={(b) => setTamperModal(b)}
                    />`;
content = content.replace(new RegExp(old_blockcard.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), new_blockcard);

// 7. Add isSweeping to BlockCard component definition
let old_blockcard_def = `function BlockCard({ block, isNew, visiblyInvalid, onTamper }) {`;
let new_blockcard_def = `function BlockCard({ block, isNew, visiblyInvalid, isSweeping, onTamper }) {`;
content = content.replace(old_blockcard_def, new_blockcard_def);

// 8. Add pulse effect to BlockCard
let old_blockcard_glow = `        {/* Card header */}`;
let new_blockcard_glow = `        {isSweeping && (
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
        {/* Card header */}`;
content = content.replace(old_blockcard_glow, new_blockcard_glow);

// 9. Update StatsBar definition to include buttons
let old_statsbar_def = `function StatsBar({ blocks, onReset, onRemoveTamper }) {`;
let new_statsbar_def = `function StatsBar({ blocks, onReset, onRemoveTamper, onVerify, onExport }) {`;
content = content.replace(old_statsbar_def, new_statsbar_def);

// 10. Add Verify/Export buttons to StatsBar
let old_buttons = `        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(59,140,255,0.1)',
            border: '1px solid rgba(59,140,255,0.25)',
            color: 'var(--color-electric-blue)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          Reset Chain
        </button>
      </div>`;

let new_buttons = `        <button
          onClick={onVerify}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--badge-teal-border)',
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
            e.currentTarget.style.background = 'var(--badge-teal-border)'
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Verify Full Chain
        </button>

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
        </button>

        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(59,140,255,0.1)',
            border: '1px solid rgba(59,140,255,0.25)',
            color: 'var(--color-electric-blue)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          Reset Chain
        </button>
      </div>`;
content = content.replace(old_buttons, new_buttons);

// 11. Update TamperBanner to show Verify passes/fails
let old_banner_def = `function TamperBanner({ info, onDismiss }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    }}>`;
let new_banner_def = `function TamperBanner({ info, onDismiss }) {
  if (info.passed) {
    return (
      <div style={{
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
      </div>
    )
  }
  if (info.failed) {
    return (
      <div style={{
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
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    }}>`;
content = content.replace(old_banner_def, new_banner_def);

// Finally, update position: relative on the BlockCard container so the glow is constrained
content = content.replace(`style={{ width: 238, flexShrink: 0 }}`, `style={{ width: 238, flexShrink: 0, position: 'relative' }}`);

fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content, 'utf-8');
console.log('Patched successfully!');
