const fs = require('fs');
const file = 'src/pages/demo/LedgerTab.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update AddBlockSidebar EMPTY_FORM and state
content = content.replace(
  /const EMPTY_FORM = \{ from: '', to: '', milestone: '', amount: '' \}/g,
  "const EMPTY_FORM = { from: '', to: '', milestone: '', amount: '', refundRef: '' }"
);

content = content.replace(
  /const \[form, setForm\] = useState\(EMPTY_FORM\)/g,
  "const [formMode, setFormMode] = useState('disbursement')\n  const [form, setForm] = useState(EMPTY_FORM)"
);

// Update handleSubmit
content = content.replace(
  /if \(!form\.from \|\| !form\.to \|\| !form\.milestone \|\| !form\.amount\) \{\r?\n      setError\('All fields are required\.'\)/,
  `if (!form.from || !form.to || !form.milestone || !form.amount || (formMode === 'refund' && !form.refundRef)) {
      setError('All fields are required.')`
);

content = content.replace(
  /if \(usedMilestones\.has\(form\.milestone\)\) \{\r?\n      const dupIdx = blocks\.find\(b => b\.milestone === form\.milestone\)\.index\r?\n      setError\('⚠ Milestone already disbursed — duplicate tranche rejected\. This loan\\'s \\'' \+ form\.milestone \+ '\\' tranche was already recorded in Block #' \+ dupIdx \+ '\.'\)\r?\n      setShakeKey\(k => k \+ 1\)\r?\n      return\r?\n    \}\r?\n    onAdd\(\{\r?\n      from: form\.from,\r?\n      to: form\.to,\r?\n      milestone: form\.milestone,\r?\n      amount: fmtAmount\(form\.amount\),\r?\n    \}\)/g,
  `if (formMode === 'refund') {
      const refIndex = parseInt(form.refundRef.replace(/[^0-9]/g, ''), 10);
      const refBlock = blocks.find(b => b.index === refIndex);
      if (refBlock) {
        const origAmt = parseInt(refBlock.amount.replace(/[^0-9]/g, ''), 10);
        if (amtNum > origAmt) {
          setError(\`⚠ Refund amount exceeds original disbursement of ₹\${origAmt.toLocaleString('en-IN')} — rejected.\`);
          setShakeKey(k => k + 1);
          return;
        }
      }
      onAdd({
        transaction_type: 'refund',
        from: form.from,
        to: form.to,
        reason: form.milestone,
        refundRef: form.refundRef,
        amount: fmtAmount(form.amount),
      });
    } else {
      if (usedMilestones.has(form.milestone)) {
        const dupIdx = blocks.find(b => b.milestone === form.milestone).index
        setError('⚠ Milestone already disbursed — duplicate tranche rejected. This loan\\'s \\'' + form.milestone + '\\' tranche was already recorded in Block #' + dupIdx + '.')
        setShakeKey(k => k + 1)
        return
      }
      onAdd({
        transaction_type: 'disbursement',
        from: form.from,
        to: form.to,
        milestone: form.milestone,
        amount: fmtAmount(form.amount),
      })
    }`
);

// Update btnLabel and btnColor
content = content.replace(
  /addPhase === 'done' \? '✓ Block added!' :\r?\n    '⛓ Sign & Add Block'/g,
  `addPhase === 'done' ? (formMode === 'refund' ? '✓ Refund added!' : '✓ Block added!') :
    (formMode === 'refund' ? '↩ Sign & Add Refund' : '⛓ Sign & Add Block')`
);

content = content.replace(
  /addPhase === 'done' \? '#10b981' :\r?\n    '#3b8cff'/g,
  `addPhase === 'done' ? '#10b981' :
    (formMode === 'refund' ? '#f59e0b' : '#3b8cff')`
);

// Add the toggle buttons
content = content.replace(
  /<span>⛓<\/span> Add New Tranche\r?\n        <\/div>\r?\n\r?\n        <div style=\{\{ display: 'flex', flexDirection: 'column', gap: 13 \}\}>/g,
  `<span>⛓</span> Add New Tranche
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => { setFormMode('disbursement'); setForm(EMPTY_FORM); setError(null); }}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: formMode === 'disbursement' ? 'rgba(59,140,255,0.2)' : 'transparent',
              color: formMode === 'disbursement' ? 'var(--color-electric-blue)' : 'var(--text-secondary)',
              fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.75rem',
            }}
          >Disbursement</button>
          <button
            onClick={() => { setFormMode('refund'); setForm(EMPTY_FORM); setError(null); }}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: formMode === 'refund' ? 'rgba(245,158,11,0.2)' : 'transparent',
              color: formMode === 'refund' ? 'var(--color-gold)' : 'var(--text-secondary)',
              fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.75rem',
            }}
          >Refund</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>`
);

// Update Form Labels and Selects
content = content.replace(
  /From \(NBFC Node\)/g,
  `{formMode === 'refund' ? 'From (Institution)' : 'From (NBFC Node)'}`
);
content = content.replace(
  /<option value="">Select NBFC…<\/option>\r?\n                \{FROM_OPTIONS\.map\(o => <option key=\{o\} value=\{o\}>\{o\}<\/option>\)\}/g,
  `<option value="">{formMode === 'refund' ? 'Select institution…' : 'Select NBFC…'}</option>
                {(formMode === 'refund' ? REFUND_FROM_OPTIONS : FROM_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}`
);

content = content.replace(
  /To \(Institution \/ Platform\)/g,
  `{formMode === 'refund' ? 'To (NBFC Node)' : 'To (Institution / Platform)'}`
);
content = content.replace(
  /<option value="">Select recipient…<\/option>\r?\n                \{TO_OPTIONS\.map\(o => <option key=\{o\} value=\{o\}>\{o\}<\/option>\)\}/g,
  `<option value="">{formMode === 'refund' ? 'Select NBFC…' : 'Select recipient…'}</option>
                {(formMode === 'refund' ? REFUND_TO_OPTIONS : TO_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}`
);

content = content.replace(
  /Milestone<\/label>\r?\n            <div style=\{\{ position: 'relative' \}\}>\r?\n              <select\r?\n                value=\{form\.milestone\}\r?\n                onChange=\{e => set\('milestone', e\.target\.value\)\}\r?\n                disabled=\{busy\}\r?\n                style=\{\{ \.\.\.selectStyle, opacity: busy \? 0\.5 : 1 \}\}\r?\n              >\r?\n                <option value="">Select milestone…<\/option>\r?\n                \{MILESTONES\.map\(m => \(\r?\n                  <option key=\{m\} value=\{m\}>\r?\n                    \{m\}\{usedMilestones\.has\(m\) \? ' ✓ disbursed' : ''\}\r?\n                  <\/option>\r?\n                \)\)\}/g,
  `{formMode === 'refund' ? 'Reason' : 'Milestone'}</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.milestone}
                onChange={e => set('milestone', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">{formMode === 'refund' ? 'Select reason…' : 'Select milestone…'}</option>
                {formMode === 'refund' 
                  ? REFUND_REASONS.map(m => <option key={m} value={m}>{m}</option>)
                  : MILESTONES.map(m => (
                    <option key={m} value={m}>
                      {m}{usedMilestones.has(m) ? ' ✓ disbursed' : ''}
                    </option>
                  ))
                }`
);

// Add refundRef field
content = content.replace(
  /<\/select>\r?\n              <svg style=\{\{ position: 'absolute', right: 10, top: '50%', transform: 'translateY\(-50%\)', pointerEvents: 'none' \}\}/g,
  `</select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}`
); // Reset this back, wait, just add refundRef div after milestone

content = content.replace(
  /<\/div>\r?\n          <\/div>\r?\n\r?\n          \{\/\* Amount \*\/\}/g,
  `</div>
          </div>

          {formMode === 'refund' && (
            <div>
              <label style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
                display: 'block', marginBottom: 5,
              }}>Original Tranche Reference</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.refundRef}
                  onChange={e => set('refundRef', e.target.value)}
                  disabled={busy}
                  style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
                >
                  <option value="">Select original block…</option>
                  {blocks.filter(b => (b.transaction_type || 'disbursement') === 'disbursement').map(b => (
                    <option key={b.id} value={\`Block #\${b.index}\`}>
                      Block #{b.index} — {b.amount} ({b.milestone})
                    </option>
                  ))}
                </select>
                <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          )}

          {/* Amount */}`
);

// Amount styles
content = content.replace(
  /background: 'rgba\(16,185,129,0\.06\)',\r?\n                border: '1px solid rgba\(16,185,129,0\.2\)',\r?\n                borderRadius: 9, padding: '9px 12px',\r?\n                color: 'var\(--color-green\)',/g,
  `background: formMode === 'refund' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
                border: formMode === 'refund' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(16,185,129,0.2)',
                borderRadius: 9, padding: '9px 12px',
                color: formMode === 'refund' ? 'var(--color-gold)' : 'var(--color-green)',`
);

content = content.replace(
  /onFocus=\{e => \{ e\.target\.style\.borderColor = 'rgba\(16,185,129,0\.5\)' \}\}\r?\n              onBlur=\{e => \{ e\.target\.style\.borderColor = 'rgba\(16,185,129,0\.2\)' \}\}/g,
  `onFocus={e => { e.target.style.borderColor = formMode === 'refund' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)' }}
              onBlur={e => { e.target.style.borderColor = formMode === 'refund' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }}`
);

fs.writeFileSync(file, content);
