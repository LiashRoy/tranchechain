import CryptoJS from 'crypto-js'

export const sha256 = (str) => CryptoJS.SHA256(str).toString()
export const GENESIS_PREV = '0'.repeat(64)
export const LOAN_ID = 'EDU-2024-001'

export const blockContent = ({ from, to, amount, milestone, timestamp, prevHash }) =>
  `${LOAN_ID}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`
export const computeHash = (block) => sha256(blockContent(block))

let _uid = 100
export const uid = () => `block-${++_uid}-${Date.now()}`

export function makeBlock(data, prevHash) {
  const b = { ...data, prevHash }
  return { ...b, originalAmount: b.amount, hash: computeHash(b), status: 'valid', wasTampered: false, id: uid() }
}

export function buildInitialChain() {
  const b1 = makeBlock({
    from: 'NBFC 1', to: 'Fintech Company',
    amount: '₹18,000', milestone: 'Admission Confirmed',
    timestamp: '2024-06-01 09:14', index: 1,
  }, GENESIS_PREV)

  const b2 = makeBlock({
    from: 'NBFC 2', to: 'Partner Institute',
    amount: '₹24,000', milestone: 'Semester 1 Start',
    timestamp: '2024-10-02 11:22', index: 2,
  }, b1.hash)

  const b3 = makeBlock({
    from: 'NBFC 2', to: 'Partner Institute',
    amount: '₹24,000', milestone: 'Semester 2 Start',
    timestamp: '2025-02-01 08:45', index: 3,
  }, b2.hash)

  return [b1, b2, b3]
}
