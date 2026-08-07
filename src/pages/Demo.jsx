import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import LedgerTab from './demo/LedgerTab'
import SignaturesTab from './demo/SignaturesTab'
import { useGlobalChain } from '../context/GlobalChainContext'

const TABS = [
  { id: 'ledger', label: '1. The Ledger' },
  { id: 'signatures', label: '2. Sign & Verify' },
]

export default function Demo() {
  const [activeTab, setActiveTab] = useState('ledger')
  const { demoBlocks: blocks, setDemoBlocks: setBlocks } = useGlobalChain()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Persistent Tab Bar */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
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
                  fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.9rem',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer',
                  transition: 'color 0.2s', zIndex: 1
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="demo-tab-indicator"
                    style={{
                      position: 'absolute', inset: 0, 
                      background: 'var(--nav-border)',
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
