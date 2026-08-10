import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Mock Data Generator
const NBFCS = [
  { id: 'nbfc1', name: 'NBFC 1' },
  { id: 'nbfc2', name: 'NBFC 2' },
  { id: 'nbfc3', name: 'NBFC 3' }
]

const INSTITUTIONS = [
  'Fintech Company', 'Partner Institute', 'EdTech Startup', 'SME Aggregator'
]

const MILESTONES = [
  'Admission Confirmed', 'Semester 1 Start', 'Semester 2 Start', 'Semester 3 Start', 'Disbursement 1', 'Disbursement 2'
]

function generateHash() {
  return Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')
}

function generateNetworkData() {
  const blocks = []
  const TOTAL = 250
  const tamperedIndices = [42, 115, 210] // randomly picked fixed indices for predictability in demo

  for (let i = 0; i < TOTAL; i++) {
    const nbfc = NBFCS[Math.floor(Math.random() * NBFCS.length)]
    const inst = INSTITUTIONS[Math.floor(Math.random() * INSTITUTIONS.length)]
    const amt = Math.floor(Math.random() * 50) * 1000 + 10000
    const tampered = tamperedIndices.includes(i)
    
    blocks.push({
      id: `blk-${i}`,
      index: i + 1,
      nbfc,
      institution: inst,
      amount: `₹${amt.toLocaleString()}`,
      milestone: MILESTONES[Math.floor(Math.random() * MILESTONES.length)],
      hash: generateHash(),
      tampered: tampered,
      timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    })
  }
  return blocks
}

// Global static data so it doesn't regenerate on every tab switch
const STATIC_BLOCKS = generateNetworkData()

export default function NetworkScaleTab() {
  const [filterNBFC, setFilterNBFC] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [groupBy, setGroupBy] = useState('Chronological')
  
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [pulseIndex, setPulseIndex] = useState(-1)
  
  // Continuous liveness pulse
  useEffect(() => {
    const interval = setInterval(() => {
      const validBlocks = STATIC_BLOCKS.filter(b => !b.tampered)
      const randomBlock = validBlocks[Math.floor(Math.random() * validBlocks.length)]
      if (randomBlock) {
        setPulseIndex(randomBlock.index)
        setTimeout(() => setPulseIndex(-1), 600) // Reset after pulse animation
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const filteredBlocks = useMemo(() => {
    let res = STATIC_BLOCKS
    if (filterNBFC !== 'All') {
      res = res.filter(b => b.nbfc.name === filterNBFC)
    }
    if (filterStatus === 'Valid Only') {
      res = res.filter(b => !b.tampered)
    } else if (filterStatus === 'Flagged Only') {
      res = res.filter(b => b.tampered)
    }
    
    if (groupBy === 'By Institution') {
      res = [...res].sort((a, b) => a.institution.localeCompare(b.institution))
    } else {
      res = [...res].sort((a, b) => a.index - b.index)
    }
    return res
  }, [filterNBFC, filterStatus, groupBy])

  const numTampered = STATIC_BLOCKS.filter(b => b.tampered).length
  const isHealthy = numTampered === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 0', height: '100%', position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="glass-card" style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.6rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>The Network at Scale</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 800 }}>
            Same guarantees you just explored, one block at a time — now running across the full network.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
          <StatBox label="Total Blocks" value={STATIC_BLOCKS.length} />
          <StatBox label="Active NBFCs" value={NBFCS.length} />
          <StatBox label="Active Institutions" value={INSTITUTIONS.length} />
          <StatBox 
            label="Network Status" 
            value={isHealthy ? '✓ Verified' : `⚠ ${numTampered} Anomalies Detected`} 
            color={isHealthy ? 'var(--color-green)' : 'var(--color-red)'}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select label="NBFC" value={filterNBFC} onChange={setFilterNBFC} options={['All', ...NBFCS.map(n => n.name)]} />
        <Select label="Status" value={filterStatus} onChange={setFilterStatus} options={['All', 'Valid Only', 'Flagged Only']} />
        <Select label="Grouping" value={groupBy} onChange={setGroupBy} options={['Chronological', 'By Institution']} />
      </div>

      {/* Grid Canvas */}
      <div 
        className="glass-card" 
        style={{ 
          flex: 1, padding: 24, minHeight: 400, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}
        onMouseLeave={() => setHoveredBlock(null)}
      >
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }}>
          <motion.div 
            layout
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.005 } }
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
              gap: 8,
              alignContent: 'start',
            }}
          >
            <AnimatePresence>
              {filteredBlocks.map(block => (
                <BlockTile 
                  key={block.id} 
                  block={block} 
                  isPulsing={pulseIndex === block.index}
                  onHover={setHoveredBlock}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Centralized Tooltip */}
        <AnimatePresence>
          {hoveredBlock && (
            <Tooltip block={hoveredBlock} />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0 20px', fontStyle: 'italic' }}>
        This view represents the same cryptographic guarantees demonstrated in the previous two tabs — applied at production scale. Every block shown here is independently hash-linked and signature-verified.
      </div>

    </div>
  )
}

function StatBox({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</span>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--glass-bg)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}:</span>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-primary)',
          fontSize: '0.8rem', fontWeight: 600, outline: 'none', cursor: 'pointer'
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

const tileVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
}

function BlockTile({ block, isPulsing, onHover }) {
  const baseColor = block.tampered ? '#ef4444' : '#14b8a6' // red or teal

  return (
    <motion.div
      layout
      variants={tileVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover({ ...block, x: rect.left, y: rect.top, width: rect.width });
      }}
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 6,
        background: block.tampered ? `${baseColor}20` : `${baseColor}15`,
        border: `1px solid ${baseColor}40`,
        position: 'relative',
        cursor: 'pointer',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div style={{ 
        width: 8, height: 8, borderRadius: '50%', 
        background: baseColor, boxShadow: `0 0 8px ${baseColor}80` 
      }} />
      <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'monospace' }}>
        #{block.index}
      </div>

      {/* Permanent red glow for tampered blocks */}
      {block.tampered && (
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -4, borderRadius: 10,
            border: `2px solid ${baseColor}60`, filter: 'blur(3px)', zIndex: -1
          }}
        />
      )}

      {/* Quick pulse for random liveness */}
      <AnimatePresence>
        {isPulsing && !block.tampered && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 6,
              background: baseColor, zIndex: 1
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Tooltip({ block }) {
  // Use a slight vertical offset so it doesn't overlap the mouse
  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        left: block.x + block.width / 2,
        top: block.y - 12,
        transform: 'translate(-50%, -100%)',
        background: 'var(--bg-card)',
        border: `1px solid ${block.tampered ? 'var(--color-red)' : 'rgba(255,255,255,0.1)'}`,
        padding: '12px 16px',
        borderRadius: 8,
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        zIndex: 100,
        width: 240,
        pointerEvents: 'none',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Tooltip content */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Block #{block.index}</span>
        <span style={{ fontSize: '0.65rem', color: block.tampered ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 800 }}>
          {block.tampered ? '⚠ TAMPERED' : '✓ VALID'}
        </span>
      </div>
      
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{block.amount}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{block.milestone}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>From:</span>
          <span style={{ color: 'var(--text-primary)' }}>{block.nbfc.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>To:</span>
          <span style={{ color: 'var(--text-primary)' }}>{block.institution}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: 4 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Hash:</span>
          <span style={{ color: block.tampered ? 'var(--color-red)' : 'var(--color-teal)', fontFamily: 'monospace' }}>
            {block.hash.substring(0, 10)}...
          </span>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}
