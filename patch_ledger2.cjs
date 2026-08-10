const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

// 1 & 2 & 3: LedgerTab props & AddBlockSidebar props
content = content.replace(
  'export default function LedgerTab({ blocks, setBlocks }) {',
  'export default function LedgerTab({ blocks, setBlocks, admissionConfirmations = [] }) {'
);

content = content.replace(
  '<AddBlockSidebar\n            blocks={blocks}\n            onAdd={handleAdd}\n            addPhase={addPhase}\n          />',
  '<AddBlockSidebar\n            blocks={blocks}\n            onAdd={handleAdd}\n            addPhase={addPhase}\n            admissionConfirmations={admissionConfirmations}\n          />'
);

content = content.replace(
  'function AddBlockSidebar({ blocks, onAdd, addPhase }) {',
  'function AddBlockSidebar({ blocks, onAdd, addPhase, admissionConfirmations = [] }) {'
);

// 4. Update handleSubmit
// Let's replace the whole handleSubmit function body to be safe
const origHandleSubmit = `const handleSubmit = () => {
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
    if (formMode === 'refund') {
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
    }
    setForm(EMPTY_FORM)
    setError(null)
  }`;

// Actually, `origHandleSubmit` might not match exactly because of formatting and newlines.
// Let's just use string replace with carefully constructed regexes or use replace on the string without backticks.
