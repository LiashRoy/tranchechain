import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoJS from 'crypto-js'

import LedgerTab from './demo/LedgerTab'
import TamperTab from './demo/TamperTab'
import SignaturesTab from './demo/SignaturesTab'

const sha256 = (str) => CryptoJS.SHA256(str).toString()
const GENESIS_PREV = '0'.repeat(64)
const LOAN_ID = 'EDU-2024-001'

const blockContent = ({ from, to, amount, milestone, timestamp, prevHash }) =>
  `${LOAN_ID}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`
const computeHash = (block) => sha256(blockContent(block))

let _uid = 100
const uid = () => `block-${++_uid}-${Date.now()}`

function makeBlock(data, prevHash) {
  const b = { ...data, prevHash }
  return { ...b, hash: computeHash(b), status: 'valid', wasTampered: false, id: uid() }
}

function buildInitialChain() {
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

const TABS = [
  { id: 'ledger', label: '1. The Ledger' },
  { id: 'tamper', label: '2. Break It' },
  { id: 'signatures', label: '3. Sign & Verify' },
]

export default function Demo() {
  const [activeTab, setActiveTab] = useState('ledger')
  const [blocks, setBlocks] = useState(() => buildInitialChain())

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Persistent Tab Bar */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,16,29,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 24px',
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.03)', 
          padding: 6, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative',
                  padding: '10px 24px', border: 'none', background: 'transparent',
                  fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.9rem',
                  color: isActive ? '#fff' : '#7a8fb0', cursor: 'pointer',
                  transition: 'color 0.2s', zIndex: 1
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="demo-tab-indicator"
                    style={{
                      position: 'absolute', inset: 0, 
                      background: 'rgba(59,140,255,0.15)',
                      borderRadius: 8, zIndex: -1,
                      border: '1px solid rgba(59,140,255,0.3)'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'ledger' && (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <LedgerTab blocks={blocks} setBlocks={setBlocks} />
            </motion.div>
          )}
          {activeTab === 'tamper' && (
            <motion.div
              key="tamper"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <TamperTab blocks={blocks} setBlocks={setBlocks} />
            </motion.div>
          )}
          {activeTab === 'signatures' && (
            <motion.div
              key="signatures"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <SignaturesTab latestBlock={blocks[blocks.length - 1]} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
