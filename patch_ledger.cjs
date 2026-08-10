const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

content = content.replace(
`export default function LedgerTab({ blocks, setBlocks }) {`,
`export default function LedgerTab({ blocks, setBlocks, admissionConfirmations = [] }) {`
);

content = content.replace(
`<AddBlockSidebar
            blocks={blocks}
            onAdd={handleAdd}
            addPhase={addPhase}
          />`,
`<AddBlockSidebar
            blocks={blocks}
            onAdd={handleAdd}
            addPhase={addPhase}
            admissionConfirmations={admissionConfirmations}
          />`
);

content = content.replace(
`function AddBlockSidebar({ blocks, onAdd, addPhase }) {`,
`function AddBlockSidebar({ blocks, onAdd, addPhase, admissionConfirmations = [] }) {`
);

content = content.replace(
`    const handleSubmit = () => {
    if (!form.from || !form.to || !form.milestone || !form.amount || (formMode === 'refund' && !form.refundRef)) {
      setError('All fields are required.')
      setShakeKey(k => k + 1)
      return
    }
    const amtNum = parseInt(form.amount.replace(/[^0-9]/g, ''), 10)
    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Enter a valid amount.')
      setShakeKey(k => k + 1)
      return
    }`,
`    const handleSubmit = () => {
    if (!form.from || !form.to || !form.milestone || !form.amount || (formMode === 'refund' && !form.refundRef)) {
      setError('All fields are required.')
      setShakeKey(k => k + 1)
      return
    }
    const amtNum = parseInt(form.amount.replace(/[^0-9]/g, ''), 10)
    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Enter a valid amount.')
      setShakeKey(k => k + 1)
      return
    }
    if (formMode === 'disbursement' && form.milestone === 'Admission Confirmed') {
      const validConfirmation = admissionConfirmations.find(c => c.verified);
      if (!validConfirmation) {
        setError('⚠ No signed Admission Confirmation on file — Institution must sign this first (see Sign & Verify tab).')
        setShakeKey(k => k + 1)
        return
      }
      form.confirmationRef = validConfirmation.signatureHash;
    }`
);

// We need to pass confirmationRef when adding the block:
content = content.replace(
`      } else {
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
    }
  }`,
`      } else {
      if (usedMilestones.has(form.milestone)) {
        const dupIdx = blocks.find(b => b.milestone === form.milestone).index
        setError('⚠ Milestone already disbursed — duplicate tranche rejected. This loan\\'s \\'' + form.milestone + '\\' tranche was already recorded in Block #' + dupIdx + '.')
        setShakeKey(k => k + 1)
        return
      }
      const blockData = {
        transaction_type: 'disbursement',
        from: form.from,
        to: form.to,
        milestone: form.milestone,
        amount: fmtAmount(form.amount),
      };
      if (form.confirmationRef) blockData.confirmationRef = form.confirmationRef;
      onAdd(blockData)
    }
  }`
);


// Now the BlockCard enhancement
// We can find `function BlockCard({ block, isHead, isGenesis, addPhase }) {` or similar
content = content.replace(
`function BlockCard({ block, isLatest, isGenesis }) {`,
`function BlockCard({ block, isLatest, isGenesis }) {`
);

// Search for where milestone is rendered.
// Let's use string insertion logic.
const blockCardOriginalStart = `<div style={{ flex: 1, minWidth: 100 }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Milestone</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 800 }}>{block.milestone}</div>
          </div>`;
          
const blockCardNewStart = `<div style={{ flex: 1, minWidth: 100 }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Milestone</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 800 }}>{block.milestone}</div>
            {block.confirmationRef && (
              <div style={{ 
                marginTop: 4, display: 'inline-block',
                background: 'rgba(16,185,129,0.1)', color: 'var(--color-green)',
                padding: '2px 8px', borderRadius: 12,
                fontSize: '0.65rem', fontWeight: 700,
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
                ✓ Institution confirmed {block.confirmationRef}
              </div>
            )}
          </div>`;

content = content.replace(blockCardOriginalStart, blockCardNewStart);

fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
