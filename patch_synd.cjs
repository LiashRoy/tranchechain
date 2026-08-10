const fs = require('fs');

let content = fs.readFileSync('src/pages/demo/LedgerTab.jsx', 'utf8');

// 1. Update BlockCard to show Syndicated badge
content = content.replace(
  `{/* Milestone / Reason */}`,
  `{/* Syndicated Badge */}
            {block.syndicationGroup && (
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--color-electric-blue)',
                background: 'rgba(59,140,255,0.1)',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-block',
                marginTop: 4,
                marginBottom: 4
              }}>
                Syndicated ({block.splitPercent}%)
              </div>
            )}
            
            {/* Milestone / Reason */}`
);

// 2. Update AddBlockSidebar definition and state
content = content.replace(
  `const [shakeKey, setShakeKey] = useState(0)
  const hashPreview = useRef('')`,
  `const [shakeKey, setShakeKey] = useState(0)
  const hashPreview = useRef('')
  const [syndication, setSyndication] = useState({ enabled: false, nbfc1: 'NBFC 1', nbfc2: 'NBFC 2', split1: 60, split2: 40, agreedAmount: '' })`
);

// 3. Update handleSubmit validation
content = content.replace(
  `    if (!form.from || !form.to || !form.milestone || !form.amount || (formMode === 'refund' && !form.refundRef)) {`,
  `    const isSyndicated = formMode === 'disbursement' && syndication.enabled;
    if ((!isSyndicated && !form.from) || !form.to || !form.milestone || !form.amount || (formMode === 'refund' && !form.refundRef)) {`
);

// 4. Update handleSubmit execution for syndication
content = content.replace(
  `    } else {
      if (usedMilestones.has(form.milestone)) {
        const dupIdx = blocks.find(b => b.milestone === form.milestone).index
        setError(\`\u26A0 Milestone already disbursed \u2014 duplicate tranche rejected. This loan's '\${form.milestone}' tranche was already recorded in Block #\${dupIdx}.\`)
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
    }`,
  `    } else {
      if (usedMilestones.has(form.milestone)) {
        const dupIdx = blocks.find(b => b.milestone === form.milestone).index
        setError(\`\u26A0 Milestone already disbursed \u2014 duplicate tranche rejected. This loan's '\${form.milestone}' tranche was already recorded in Block #\${dupIdx}.\`)
        setShakeKey(k => k + 1)
        return
      }
      if (isSyndicated) {
        if (syndication.split1 + syndication.split2 !== 100) {
          setError('Syndication splits must sum to 100%.')
          setShakeKey(k => k + 1)
          return
        }
        if (syndication.nbfc1 === syndication.nbfc2) {
          setError('Selected NBFCs must be distinct.')
          setShakeKey(k => k + 1)
          return
        }
        const agreedNum = parseInt(syndication.agreedAmount.replace(/[^0-9]/g, ''), 10)
        if (isNaN(agreedNum) || agreedNum <= 0) {
          setError('Enter a valid agreed amount for syndication cap.')
          setShakeKey(k => k + 1)
          return
        }
        if (amtNum > agreedNum) {
          setError(\`\u26A0 Syndicated cap exceeded \u2014 combined amount of \u20B9\${amtNum.toLocaleString('en-IN')} exceeds the \u20B9\${agreedNum.toLocaleString('en-IN')} agreed cap.\`)
          setShakeKey(k => k + 1)
          return
        }
        const syndicationRef = \`synd-\${Date.now()}\`;
        const amt1 = Math.round(amtNum * (syndication.split1 / 100));
        const amt2 = amtNum - amt1;
        const block1 = {
          transaction_type: 'disbursement',
          from: syndication.nbfc1,
          to: form.to,
          milestone: form.milestone,
          amount: \`\u20B9\${amt1.toLocaleString('en-IN')}\`,
          syndicationGroup: syndicationRef,
          splitPercent: syndication.split1,
        };
        const block2 = {
          transaction_type: 'disbursement',
          from: syndication.nbfc2,
          to: form.to,
          milestone: form.milestone,
          amount: \`\u20B9\${amt2.toLocaleString('en-IN')}\`,
          syndicationGroup: syndicationRef,
          splitPercent: syndication.split2,
        };
        if (form.confirmationRef) {
          block1.confirmationRef = form.confirmationRef;
          block2.confirmationRef = form.confirmationRef;
        }
        onAdd([block1, block2]);
      } else {
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

// 5. Hide 'From' when syndicated
content = content.replace(
  `          {/* From */}
          <div>
            <label style={{`,
  `          {/* From */}
          {!(formMode === 'disbursement' && syndication.enabled) && (
          <div>
            <label style={{`
);
content = content.replace(
  `                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* To */}`,
  `                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
          )}

          {/* To */}`
);


// 6. Add the syndication panel below the main glass-card in AddBlockSidebar container
content = content.replace(
  `      </motion.div>
    </div>
  )
}

/* `,
  `      </motion.div>

      {/* Syndication Panel */}
      <motion.div
        className="glass-card"
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            Syndicated Loan
          </span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={syndication.enabled} 
              onChange={e => setSyndication(s => ({ ...s, enabled: e.target.checked }))}
              style={{ accentColor: 'var(--color-electric-blue)', transform: 'scale(1.2)' }}
            />
          </label>
        </div>
        
        {syndication.enabled && formMode === 'disbursement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NBFC 1</label>
                <select 
                  value={syndication.nbfc1} 
                  onChange={e => setSyndication(s => ({ ...s, nbfc1: e.target.value }))}
                  style={selectStyle}
                >
                  {FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ width: '60px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>%</label>
                <input 
                  type="number" 
                  value={syndication.split1} 
                  onChange={e => setSyndication(s => ({ ...s, split1: Number(e.target.value) }))}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem', background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)', borderRadius: 9, padding: '9px 8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NBFC 2</label>
                <select 
                  value={syndication.nbfc2} 
                  onChange={e => setSyndication(s => ({ ...s, nbfc2: e.target.value }))}
                  style={selectStyle}
                >
                  {FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ width: '60px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>%</label>
                <input 
                  type="number" 
                  value={syndication.split2} 
                  onChange={e => setSyndication(s => ({ ...s, split2: Number(e.target.value) }))}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem', background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)', borderRadius: 9, padding: '9px 8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Agreed Cap Amount (\u20B9)</label>
              <input 
                type="text" 
                value={syndication.agreedAmount} 
                onChange={e => setSyndication(s => ({ ...s, agreedAmount: fmtAmount(e.target.value) }))}
                placeholder="e.g. \u20B95,00,000"
                style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem', background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)', borderRadius: 9, padding: '9px 12px', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* `
);

// 7. Update handleAdd to accept array
content = content.replace(
  `  const handleAdd = useCallback((formData) => {
    setAddPhase('computing')
    addTimers.current.push(setTimeout(() => {
      setAddPhase('signing')
      addTimers.current.push(setTimeout(() => {
        setBlocks(prev => {
          const prevBlock = prev[prev.length - 1]
          const ts = new Date().toLocaleString('en-IN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false,
          }).replace(',', '')
          const newBlock = makeBlock({
            ...formData,
            timestamp: ts,
            index: prev.length + 1,
          }, prevBlock.hash)
          setNewestId(newBlock.id)
          return [...prev, newBlock]
        })`,
  `  const handleAdd = useCallback((formDataOrArray) => {
    setAddPhase('computing')
    addTimers.current.push(setTimeout(() => {
      setAddPhase('signing')
      addTimers.current.push(setTimeout(() => {
        setBlocks(prev => {
          const forms = Array.isArray(formDataOrArray) ? formDataOrArray : [formDataOrArray];
          let currentPrevHash = prev[prev.length - 1].hash;
          let currentLength = prev.length;
          const newBlocks = [];
          for (const formData of forms) {
            const ts = new Date().toLocaleString('en-IN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', hour12: false,
            }).replace(',', '')
            const newBlock = makeBlock({
              ...formData,
              timestamp: ts,
              index: currentLength + 1,
            }, currentPrevHash)
            newBlocks.push(newBlock);
            currentPrevHash = newBlock.hash;
            currentLength++;
          }
          setNewestId(newBlocks[newBlocks.length - 1].id)
          return [...prev, ...newBlocks]
        })`
);

fs.writeFileSync('src/pages/demo/LedgerTab.jsx', content);
console.log('Patch complete.');
