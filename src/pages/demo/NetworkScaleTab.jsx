import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'

const NBFCS = [
  { id: 'nbfc1', name: 'NBFC 1', color: '#3b82f6' },
  { id: 'nbfc2', name: 'NBFC 2', color: '#8b5cf6' },
  { id: 'nbfc3', name: 'NBFC 3', color: '#ec4899' }
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

const BLOCKS_PER_LANE = 84

function generateLaneData(nbfc, tamperedIndex) {
  const blocks = []
  for (let i = 0; i < BLOCKS_PER_LANE; i++) {
    const inst = INSTITUTIONS[Math.floor(Math.random() * INSTITUTIONS.length)]
    const amt = Math.floor(Math.random() * 50) * 1000 + 10000
    
    blocks.push({
      id: `${nbfc.id}-blk-${i}`,
      index: i,
      laneId: nbfc.id,
      nbfc,
      institution: inst,
      amount: `₹${amt.toLocaleString()}`,
      milestone: MILESTONES[Math.floor(Math.random() * MILESTONES.length)],
      hash: generateHash(),
      isTamperSource: i === tamperedIndex,
      timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    })
  }
  return blocks
}

// Generate static data on load
const STATIC_LANES = [
  { nbfc: NBFCS[0], blocks: generateLaneData(NBFCS[0], -1), firstTamperedIndex: -1 },       // Clean lane
  { nbfc: NBFCS[1], blocks: generateLaneData(NBFCS[1], 35), firstTamperedIndex: 35 },       // Tampered early
  { nbfc: NBFCS[2], blocks: generateLaneData(NBFCS[2], 68), firstTamperedIndex: 68 },       // Tampered late
]

const TOTAL_BLOCKS = BLOCKS_PER_LANE * 3

export default function NetworkScaleTab() {
  const [highlightNBFC, setHighlightNBFC] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  
  const [hoveredBlock, setHoveredBlock] = useState(null)
  
  const [progress, setProgress] = useState(-1)
  const intervalRef = useRef(null)

  const startSweep = () => {
    setProgress(-1)
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    // Give it a tiny beat in 'pending' state before starting
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= BLOCKS_PER_LANE + 5) {
            clearInterval(intervalRef.current)
            return p
          }
          return p + 1
        })
      }, 35) // fast sweep speed
    }, 400)
  }

  // Trigger sweep on mount
  useEffect(() => {
    startSweep()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 0', height: '100%', position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="glass-card" style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.6rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>The Network at Scale</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 800 }}>
            Watch the network verify every tranche from NBFC release to institution confirmation — live, across all three lending partners.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
          <StatBox label="Total Blocks" value={TOTAL_BLOCKS} />
          <StatBox label="Active NBFCs" value={3} />
          <StatBox 
            label="Network Status" 
            value={progress >= BLOCKS_PER_LANE ? '⚠ Anomalies Detected' : 'Verifying...'} 
            color={progress >= BLOCKS_PER_LANE ? 'var(--color-red)' : 'var(--text-primary)'}
          />
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select label="Highlight Lane" value={highlightNBFC} onChange={setHighlightNBFC} options={['All', ...NBFCS.map(n => n.name)]} />
          <Select label="Status" value={filterStatus} onChange={setFilterStatus} options={['All', 'Valid Only', 'Flagged Only']} />
        </div>
        <button 
          className="btn-primary" 
          onClick={startSweep}
          style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <Play size={14} /> Replay Verification
        </button>
      </div>

      {/* Multi-Lane Canvas */}
      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 400 }}>
        {STATIC_LANES.map(lane => (
          <NbfcLane 
            key={lane.nbfc.id} 
            lane={lane} 
            progress={progress} 
            onHover={setHoveredBlock}
            filterStatus={filterStatus}
            isDimmed={highlightNBFC !== 'All' && highlightNBFC !== lane.nbfc.name}
          />
        ))}

        {/* Centralized Tooltip */}
        <AnimatePresence>
          {hoveredBlock && (
            <Tooltip block={hoveredBlock.block} state={hoveredBlock.state} pos={hoveredBlock.pos} />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0 20px', fontStyle: 'italic' }}>
        Every block shown here is independently hash-linked and signature-verified within its respective lane.
      </div>

    </div>
  )
}

function NbfcLane({ lane, progress, onHover, filterStatus, isDimmed }) {
  // Determine endpoint status based on sweep progress
  const isFinished = progress >= BLOCKS_PER_LANE
  const isBroken = lane.firstTamperedIndex !== -1
  const badCount = isBroken ? BLOCKS_PER_LANE - lane.firstTamperedIndex : 0

  return (
    <div 
      className="glass-card" 
      style={{ 
        flex: 1, padding: '20px', display: 'flex', flexDirection: 'column',
        transition: 'opacity 0.3s, filter 0.3s',
        opacity: isDimmed ? 0.4 : 1,
        filter: isDimmed ? 'grayscale(80%)' : 'none',
        overflow: 'hidden'
      }}
      onMouseLeave={() => onHover(null)}
    >
      {/* Lane Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: lane.nbfc.color, boxShadow: `0 0 10px ${lane.nbfc.color}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{lane.nbfc.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{BLOCKS_PER_LANE} tranches</div>
        </div>
      </div>

      {/* Grid of Blocks */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))',
          gap: 6,
          alignContent: 'start',
        }}>
          {lane.blocks.map(block => {
            // Determine state for this block
            let state = 'pending'
            if (progress >= block.index) {
              if (lane.firstTamperedIndex !== -1 && block.index > lane.firstTamperedIndex) {
                state = 'broken_downstream'
              } else if (lane.firstTamperedIndex !== -1 && block.index === lane.firstTamperedIndex) {
                state = 'tampered'
              } else {
                state = 'valid'
              }
            }

            // Filtering visibility
            const isFlagged = state === 'tampered' || state === 'broken_downstream'
            if (filterStatus === 'Valid Only' && (isFlagged || state === 'pending')) return null
            if (filterStatus === 'Flagged Only' && !isFlagged) return null

            return (
              <BlockTile 
                key={block.id} 
                block={block} 
                state={state}
                isActivelySweeping={progress === block.index}
                onHover={(pos) => onHover({ block, state, pos })}
              />
            )
          })}
        </div>
      </div>

      {/* Endpoint Node */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8 }}>
          Endpoint: Partner Institutions
        </div>
        {isFinished ? (
          isBroken ? (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--color-amber)', color: 'var(--color-amber)', padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600 }}>
              ⚠ Cannot confirm {badCount} tranches<br/>(Chain broken at #{lane.firstTamperedIndex})
            </div>
          ) : (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--color-green)', color: 'var(--color-green)', padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600 }}>
              ✓ All {BLOCKS_PER_LANE} tranches verified
            </div>
          )
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem' }}>
            Awaiting Verification...
          </div>
        )}
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
  pending: { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', scale: 1 },
  valid: { background: 'rgba(20, 184, 166, 0.2)', borderColor: 'rgba(20, 184, 166, 0.5)', scale: 1 },
  tampered: { background: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.8)', scale: [1, 1.2, 1] },
  broken_downstream: { background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.4)', scale: 1 }
}

function BlockTile({ block, state, isActivelySweeping, onHover }) {
  
  const isTampered = state === 'tampered'
  
  return (
    <motion.div
      layout
      variants={tileVariants}
      initial="pending"
      animate={state}
      transition={{ duration: 0.2 }}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover({ x: rect.left, y: rect.top, width: rect.width });
      }}
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 4,
        position: 'relative',
        cursor: 'pointer',
        boxSizing: 'border-box',
        borderStyle: 'solid',
        borderWidth: 1
      }}
    >
      {/* Permanent red glow for tampered blocks */}
      {isTampered && (
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -3, borderRadius: 6,
            border: `1px solid var(--color-red)`, filter: 'blur(2px)', zIndex: -1
          }}
        />
      )}

      {/* Sweeping pulse effect */}
      <AnimatePresence>
        {isActivelySweeping && state === 'valid' && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 4,
              background: 'var(--color-teal)', zIndex: 1
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Tooltip({ block, state, pos }) {
  let statusText = 'PENDING'
  let statusColor = 'var(--text-secondary)'
  if (state === 'valid') { statusText = '✓ VERIFIED'; statusColor = 'var(--color-green)' }
  if (state === 'tampered') { statusText = '⚠ TAMPERED'; statusColor = 'var(--color-red)' }
  if (state === 'broken_downstream') { statusText = '⚠ BROKEN DOWNSTREAM'; statusColor = 'var(--color-amber)' }

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        left: pos.x + pos.width / 2,
        top: pos.y - 12,
        transform: 'translate(-50%, -100%)',
        background: 'var(--bg-card)',
        border: `1px solid ${statusColor}`,
        padding: '12px 16px',
        borderRadius: 8,
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        zIndex: 100,
        width: 240,
        pointerEvents: 'none',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Block #{block.index}</span>
        <span style={{ fontSize: '0.65rem', color: statusColor, fontWeight: 800 }}>
          {statusText}
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
          <span style={{ color: statusColor, fontFamily: 'monospace' }}>
            {block.hash.substring(0, 10)}...
          </span>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}
