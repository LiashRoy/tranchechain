const fs = require('fs');
let content = fs.readFileSync('src/pages/demo/SignaturesTab.jsx', 'utf8');

const admissionRecordCode = `
const ADMISSION_RECORD = {
  studentRef: 'STU-2024-001',
  institution: 'Partner Institute',
  course: 'B.Tech CSE',
  date: '2024-06-01',
  amount: '₹18,000',
}

const msgOfAdmission = (record) =>
  \`ADMISSION_CONF | STUDENT:\${record.studentRef} | INSTITUTION:\${record.institution} | COURSE:\${record.course} | DATE:\${record.date} | AMOUNT:\${record.amount}\`
`;

content = content.replace('const msgOf = ({ from, to, amount, milestone }) =>\n  `LOAN:EDU-2024-001 | FROM:${from} | TO:${to} | AMOUNT:${amount} | MILESTONE:${milestone}`', 
`const msgOf = ({ from, to, amount, milestone }) =>
  \`LOAN:EDU-2024-001 | FROM:\${from} | TO:\${to} | AMOUNT:\${amount} | MILESTONE:\${milestone}\`
` + admissionRecordCode);

// TrancheMsgCard logic change
const trancheMsgCardOriginal = `function TrancheMsgCard({ tranche, editable = false, editAmount, onEditAmount }) {`;
const trancheMsgCardNew = `function TrancheMsgCard({ tranche, editable = false, editAmount, onEditAmount, signerRole = 'nbfc' }) {
  const isInst = signerRole === 'institution';
  const displayFields = isInst ? [
    { k: 'RECORD', v: 'ADMISSION_CONF', c: 'var(--text-secondary)' },
    { k: 'STUDENT', v: ADMISSION_RECORD.studentRef, c: 'var(--color-teal)' },
    { k: 'INSTITUTION', v: ADMISSION_RECORD.institution, c: 'var(--color-teal)' },
    { k: 'COURSE', v: ADMISSION_RECORD.course, c: 'var(--color-electric-blue)' },
    { k: 'DATE', v: ADMISSION_RECORD.date, c: 'var(--color-electric-blue)' }
  ] : [
    { k: 'LOAN',      v: 'EDU-2024-001',    c: 'var(--text-secondary)' },
    { k: 'FROM',      v: tranche.from,       c: 'var(--color-teal)' },
    { k: 'TO',        v: tranche.to,         c: 'var(--color-teal)' },
    { k: 'MILESTONE', v: tranche.milestone,  c: 'var(--color-electric-blue)' },
  ];
`;

content = content.replace(trancheMsgCardOriginal, trancheMsgCardNew);

const oldMap = `[
          { k: 'LOAN',      v: 'EDU-2024-001',    c: 'var(--text-secondary)' },
          { k: 'FROM',      v: tranche.from,       c: 'var(--color-teal)' },
          { k: 'TO',        v: tranche.to,         c: 'var(--color-teal)' },
          { k: 'MILESTONE', v: tranche.milestone,  c: 'var(--color-electric-blue)' },
        ].map`;
content = content.replace(oldMap, `displayFields.map`);

// Step components
content = content.replace(/function Step1\(\{ onComplete \}\) \{/, 'function Step1({ onComplete, signerRole = \'nbfc\' }) {');
content = content.replace(/Generate NBFC Key Pair/g, '{signerRole === \'institution\' ? \'Generate Institution Key Pair\' : \'Generate NBFC Key Pair\'}');

content = content.replace(/function Step2\(\{ keys, tranche, onComplete \}\) \{/g, 'function Step2({ keys, tranche, onComplete, signerRole = \'nbfc\' }) {');
content = content.replace(/const msg = msgOf\(tranche\)/g, 'const msg = signerRole === \'institution\' ? msgOfAdmission(ADMISSION_RECORD) : msgOf(tranche)');
content = content.replace(/<TrancheMsgCard tranche=\{tranche\} \/>/g, '<TrancheMsgCard tranche={tranche} signerRole={signerRole} />');
content = content.replace(/<h2>2. Sign the Tranche Message<\/h2>/g, '<h2>{signerRole === \'institution\' ? \'2. Sign an Admission Confirmation\' : \'2. Sign the Tranche Message\'}</h2>');

content = content.replace(/function Step3\(\{ keys, tranche, sig, onComplete \}\) \{/g, 'function Step3({ keys, tranche, sig, onComplete, signerRole = \'nbfc\', onAdmissionConfirmed }) {\n  const [toast, setToast] = useState(null)');
// Need to add toast for step 3. 
// Step 3 handleVerify:
content = content.replace(
`      if (isValid) {
        setPhase('valid')
        setTimeout(() => {
          onComplete()
        }, 3000)
      }`,
`      if (isValid) {
        setPhase('valid')
        if (signerRole === 'institution' && onAdmissionConfirmed) {
          onAdmissionConfirmed({
            ...ADMISSION_RECORD,
            signatureHash: sig.sigHex.slice(0, 12),
            verified: true,
            timestamp: new Date().toISOString()
          })
          setToast('✓ Admission Confirmation stored — now available for Ledger verification')
        }
        setTimeout(() => {
          onComplete()
        }, 3000)
      }`
);
content = content.replace(/<h2>3. Verify the NBFC Signature<\/h2>/g, '<h2>{signerRole === \'institution\' ? \'3. Verify Institution Signature\' : \'3. Verify the NBFC Signature\'}</h2>');
content = content.replace(/<TrancheMsgCard tranche=\{tranche\} \/>/g, '<TrancheMsgCard tranche={tranche} signerRole={signerRole} />'); // Step 3 has TrancheMsgCard too

// Add toast UI to Step 3
content = content.replace(
`    <div style={{ marginTop: 24 }}>`,
`    <div style={{ marginTop: 24 }}>
      {toast && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: 'var(--color-green)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.85rem' }}>{toast}</div>}`
);

content = content.replace(/function Step4\(\{ keys, tranche, sig \}\) \{/g, 'function Step4({ keys, tranche, sig, signerRole = \'nbfc\' }) {');
content = content.replace(/const origMsg = msgOf\(tranche\)/g, 'const origMsg = signerRole === \'institution\' ? msgOfAdmission(ADMISSION_RECORD) : msgOf(tranche)');
content = content.replace(/const fakeMsg = msgOf\(\{ \.\.\.tranche, amount: editAmount \}\)/g, 'const fakeMsg = signerRole === \'institution\' ? msgOfAdmission({ ...ADMISSION_RECORD, amount: editAmount }) : msgOf({ ...tranche, amount: editAmount })');
content = content.replace(/<TrancheMsgCard\s+tranche=\{tranche\}\s+editable\s+editAmount=\{editAmount\}\s+onEditAmount=\{setEditAmount\}\s+\/>/g, '<TrancheMsgCard tranche={tranche} editable editAmount={editAmount} onEditAmount={setEditAmount} signerRole={signerRole} />');
content = content.replace(/<h2>4. Try to Tamper with the Tranche<\/h2>/g, '<h2>{signerRole === \'institution\' ? \'4. Try to Tamper Admission Record\' : \'4. Try to Tamper with the Tranche\'}</h2>');
content = content.replace(/const amountStr = String\(tranche\.amount\)/g, 'const amountStr = String(signerRole === \'institution\' ? ADMISSION_RECORD.amount : tranche.amount)');


// Main Component updates
content = content.replace(
`export default function SignaturesTab({ latestBlock }) {
  const [activeStep, setActiveStep] = useState(1)
  const [keys,  setKeys]  = useState(null)
  const [sig,   setSig]   = useState(null)`,
`export default function SignaturesTab({ latestBlock, onAdmissionConfirmed }) {
  const [activeStep, setActiveStep] = useState(1)
  const [keys,  setKeys]  = useState(null)
  const [sig,   setSig]   = useState(null)
  const [signerRole, setSignerRole] = useState('nbfc')`
);

const roleSelectorCode = `
        {/* Role Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            {['nbfc', 'institution'].map(role => (
              <button
                key={role}
                onClick={() => {
                  setSignerRole(role)
                  setActiveStep(1)
                  setKeys(null)
                  setSig(null)
                }}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none',
                  background: signerRole === role ? 'rgba(59,140,255,0.1)' : 'transparent',
                  color: signerRole === role ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
`;

content = content.replace(
`        {/* Progress bar */}
        <ProgressBar activeStep={activeStep} />`,
roleSelectorCode + `
        {/* Progress bar */}
        <ProgressBar activeStep={activeStep} />`
);


content = content.replace(/<Step1 onComplete=\{\(k\) => \{ setKeys\(k\); setActiveStep\(2\) \}\} \/>/g, '<Step1 onComplete={(k) => { setKeys(k); setActiveStep(2) }} signerRole={signerRole} />');
content = content.replace(/<Step2 keys=\{keys\} tranche=\{latestBlock \|\| \{\}\} onComplete=\{\(s\) => \{ setSig\(s\); setActiveStep\(3\) \}\} \/>/g, '<Step2 keys={keys} tranche={latestBlock || {}} onComplete={(s) => { setSig(s); setActiveStep(3) }} signerRole={signerRole} />');
content = content.replace(/<Step3 keys=\{keys\} tranche=\{latestBlock \|\| \{\}\} sig=\{sig\} onComplete=\{\(\) => setActiveStep\(4\)\} \/>/g, '<Step3 keys={keys} tranche={latestBlock || {}} sig={sig} onComplete={() => setActiveStep(4)} signerRole={signerRole} onAdmissionConfirmed={onAdmissionConfirmed} />');
content = content.replace(/<Step4 keys=\{keys\} tranche=\{latestBlock \|\| \{\}\} sig=\{sig\} \/>/g, '<Step4 keys={keys} tranche={latestBlock || {}} sig={sig} signerRole={signerRole} />');

fs.writeFileSync('src/pages/demo/SignaturesTab.jsx', content);
