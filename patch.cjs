const fs = require('fs');

function patchChain() {
  const file = 'src/utils/chain.js';
  let content = fs.readFileSync(file, 'utf8');

  // 1. blockContent
  content = content.replace(
    /export const blockContent = \(\{(.*?)prevHash\}\) =>\r?\n\s*`(.*?)`/s,
    "export const blockContent = ({ from, to, amount, milestone, timestamp, prevHash, transaction_type }) =>\n  `${LOAN_ID}||${transaction_type || 'disbursement'}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`"
  );
  
  // 2. makeBlock
  content = content.replace(
    /export function makeBlock\(data, prevHash\) \{/g,
    "export function makeBlock({ transaction_type = 'disbursement', reason, refundRef, ...data }, prevHash) {\n  data.transaction_type = transaction_type;\n  if (reason) data.reason = reason;\n  if (refundRef) data.refundRef = refundRef;"
  );

  // 3. buildInitialChain - add transaction_type
  content = content.replace(
    /amount: '₹18,000', milestone: 'Admission Confirmed',/g,
    "amount: '₹18,000', milestone: 'Admission Confirmed', transaction_type: 'disbursement',"
  ).replace(
    /amount: '₹24,000', milestone: 'Semester 1 Start',/g,
    "amount: '₹24,000', milestone: 'Semester 1 Start', transaction_type: 'disbursement',"
  ).replace(
    /amount: '₹24,000', milestone: 'Semester 2 Start',/g,
    "amount: '₹24,000', milestone: 'Semester 2 Start', transaction_type: 'disbursement',"
  );

  fs.writeFileSync(file, content);
}

function patchLedgerTab() {
  const file = 'src/pages/demo/LedgerTab.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // a) blockContent
  content = content.replace(
    /const blockContent = \(\{(.*?)prevHash \}\) =>\r?\n\s*`(.*?)`/g,
    "const blockContent = ({ from, to, amount, milestone, timestamp, prevHash, transaction_type }) =>\n  `${LOAN_ID}||${transaction_type || 'disbursement'}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`"
  );

  content = content.replace(
    /const blockContent = \(\{(.*?)prevHash\}\) =>\r?\n\s*`(.*?)`/s,
    "const blockContent = ({ from, to, amount, milestone, timestamp, prevHash, transaction_type }) =>\n  `${LOAN_ID}||${transaction_type || 'disbursement'}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`"
  );

  // a) makeBlock
  content = content.replace(
    /function makeBlock\(data, prevHash\) \{/g,
    "function makeBlock({ transaction_type = 'disbursement', reason, refundRef, ...data }, prevHash) {\n  data.transaction_type = transaction_type;\n  if (reason) data.reason = reason;\n  if (refundRef) data.refundRef = refundRef;"
  );

  // a) buildInitialChain
  content = content.replace(
    /amount: '₹18,000', milestone: 'Admission Confirmed',/g,
    "amount: '₹18,000', milestone: 'Admission Confirmed', transaction_type: 'disbursement',"
  ).replace(
    /amount: '₹24,000', milestone: 'Semester 1 Start',/g,
    "amount: '₹24,000', milestone: 'Semester 1 Start', transaction_type: 'disbursement',"
  ).replace(
    /amount: '₹24,000', milestone: 'Semester 2 Start',/g,
    "amount: '₹24,000', milestone: 'Semester 2 Start', transaction_type: 'disbursement',"
  );

  // b) Constants
  content = content.replace(
    /const MILESTONES   = \[(.*?)\]/g,
    "const MILESTONES   = [$1]\nconst REFUND_REASONS = ['Mid-Semester Withdrawal', 'Course Cancellation', 'Overpayment Correction']\nconst REFUND_FROM_OPTIONS = ['Partner Institute', 'Fintech Company']\nconst REFUND_TO_OPTIONS = ['NBFC 1', 'NBFC 2', 'NBFC 3']"
  );

  // StatsBar changes
  content = content.replace(
    /const isClean = broken === 0/g,
    `const isClean = broken === 0
  
  const parseAmt = (v) => parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
  const disbursedTotal = blocks.filter(b => (b.transaction_type || 'disbursement') === 'disbursement').reduce((sum, b) => sum + parseAmt(b.amount), 0)
  const refundTotal = blocks.filter(b => b.transaction_type === 'refund').reduce((sum, b) => sum + parseAmt(b.amount), 0)
  const netDisbursed = disbursedTotal - refundTotal`
  );

  content = content.replace(
    /\{ label: 'Valid Blocks', value: `\$\{valid\}`(.*?) \},/g,
    "{ label: 'Valid Blocks', value: `${valid}`$1 },\n        { label: 'Net Disbursed', value: `₹${netDisbursed.toLocaleString('en-IN')}`, color: 'var(--color-gold)' },"
  );

  // BlockCard changes
  content = content.replace(
    /function BlockCard\(\{ block, isNew, visiblyInvalid, isSweeping, onTamper \}\) \{/g,
    "function BlockCard({ block, isNew, visiblyInvalid, isSweeping, onTamper }) {\n  const isRefund = block.transaction_type === 'refund'"
  );

  content = content.replace(
    /const borderColor =\r?\n    effectiveStatus === 'invalid'  \? 'rgba\(239,68,68,0\.45\)'  :\r?\n    effectiveStatus === 'tampered' \? 'rgba\(245,158,11,0\.45\)' :\r?\n    'rgba\(59,140,255,0\.18\)'/g,
    `const borderColor =
    effectiveStatus === 'invalid'  ? 'rgba(239,68,68,0.45)'  :
    effectiveStatus === 'tampered' ? 'rgba(245,158,11,0.45)' :
    isRefund ? 'rgba(245,158,11,0.35)' :
    'rgba(59,140,255,0.18)'`
  );

  content = content.replace(
    /const headerGlow =\r?\n    effectiveStatus === 'invalid'  \? 'rgba\(239,68,68,0\.07\)'  :\r?\n    effectiveStatus === 'tampered' \? 'rgba\(245,158,11,0\.07\)' :\r?\n    'rgba\(59,140,255,0\.05\)'/g,
    `const headerGlow =
    effectiveStatus === 'invalid'  ? 'rgba(239,68,68,0.07)'  :
    effectiveStatus === 'tampered' ? 'rgba(245,158,11,0.07)' :
    isRefund ? 'rgba(245,158,11,0.05)' :
    'rgba(59,140,255,0.05)'`
  );

  content = content.replace(
    /background: effectiveStatus === 'invalid' \? 'var\(--color-red\)' :\r?\n                          effectiveStatus === 'tampered' \? 'var\(--color-gold\)' : 'var\(--color-green\)',/g,
    "background: effectiveStatus === 'invalid' ? 'var(--color-red)' :\n                          effectiveStatus === 'tampered' ? 'var(--color-gold)' : (isRefund ? 'var(--color-gold)' : 'var(--color-green)'),"
  );

  content = content.replace(
    /boxShadow: `0 0 6px \$\{effectiveStatus === 'invalid' \? '#ef444480' :\r?\n                           effectiveStatus === 'tampered' \? '#f59e0b80' : '#10b98180'\}`/g,
    "boxShadow: `0 0 6px ${effectiveStatus === 'invalid' ? '#ef444480' :\n                           effectiveStatus === 'tampered' ? '#f59e0b80' : (isRefund ? '#f59e0b80' : '#10b98180')}`"
  );

  content = content.replace(
    /<span>Block #\{block\.index\}<\/span>\r?\n          <\/div>/g,
    `<span>Block #{block.index}</span>
            {isRefund && (
              <span style={{
                padding: '2px 6px', borderRadius: '999px',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
                fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                fontSize: '0.6rem', color: 'var(--color-gold)', letterSpacing: '0.02em',
              }}>REFUND</span>
            )}
          </div>`
  );

  content = content.replace(
    /color: 'var\(--color-green\)', letterSpacing: '-0\.01em',\r?\n            \}\}>\r?\n              \{block\.amount\}\r?\n            <\/div>\r?\n            <div style=\{\{\r?\n              fontFamily: 'Manrope, sans-serif', fontSize: '0\.76rem',\r?\n              color: 'var\(--color-electric-blue\)', fontWeight: 800,\r?\n            \}\}>\{block\.milestone\}<\/div>/g,
    `color: isRefund ? 'var(--color-gold)' : 'var(--color-green)', letterSpacing: '-0.01em',
            }}>
              {isRefund && <span style={{ fontSize: '0.9rem', marginRight: 4 }}>↩</span>}
              {block.amount}
            </div>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem',
              color: 'var(--color-electric-blue)', fontWeight: 800,
            }}>{isRefund ? block.reason : block.milestone}</div>
            {isRefund && block.refundRef && (
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem',
                color: 'var(--color-gold)', fontWeight: 600,
              }}>Ref: {block.refundRef}</div>
            )}`
  );

  fs.writeFileSync(file, content);
}

patchChain();
patchLedgerTab();
