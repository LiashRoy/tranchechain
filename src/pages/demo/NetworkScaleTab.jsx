import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Plus } from 'lucide-react'
import React from 'react'

const NBFCS = [
  { id: 'nbfc1', name: 'NBFC 1', color: '#3b82f6' },
  { id: 'nbfc2', name: 'NBFC 2', color: '#8b5cf6' },
  { id: 'nbfc3', name: 'NBFC 3', color: '#ec4899' }
]

const INSTITUTIONS = [
  'Institution 1', 'Institution 2', 'Institution 3', 'Institution 4'
]

const MILESTONES = [
  'Admission Confirmed', 'Semester 1 Start', 'Semester 2 Start', 'Semester 3 Start', 'Disbursement 1', 'Disbursement 2'
]

// Seeded PRNG (Mulberry32)
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const BLOCKS_PER_INSTITUTION = 21
const BLOCKS_PER_LANE = BLOCKS_PER_INSTITUTION * INSTITUTIONS.length

function generateLaneData(nbfc, random, tamperedInstitution = null, tamperedOffset = 0) {
  const blocks = []
  
  INSTITUTIONS.forEach(inst => {
    for (let i = 0; i < BLOCKS_PER_INSTITUTION; i++) {
      const amt = Math.floor(random() * 50) * 1000 + 10000
      blocks.push({
        laneId: nbfc.id,
        nbfc,
        institution: inst,
        amount: `₹${amt.toLocaleString()}`,
        milestone: MILESTONES[Math.floor(random() * MILESTONES.length)],
        hash: Array.from({length: 40}, () => Math.floor(random()*16).toString(16)).join(''),
        tampered: false,
        timestamp: new Date(Date.now() - random() * 10000000000).toISOString()
      })
    }
  })

  blocks.forEach((b, i) => {
    b.id = `${nbfc.id}-blk-${i}`
    b.index = i
  })

  if (tamperedInstitution) {
    const clusterStart = blocks.findIndex(b => b.institution === tamperedInstitution)
    if (clusterStart !== -1 && tamperedOffset < BLOCKS_PER_INSTITUTION) {
      blocks[clusterStart + tamperedOffset].tampered = true
    }
  }

  return blocks
}

function getScenarioData(scenario) {
  let seed = 300 // Default: Multi-NBFC Anomaly
  if (scenario === 'Clean Network') seed = 100
  if (scenario === 'Single Anomaly') seed = 200

  const random = mulberry32(seed)

  if (scenario === 'Clean Network') {
    return [
      { nbfc: NBFCS[0], blocks: generateLaneData(NBFCS[0], random, null) },
      { nbfc: NBFCS[1], blocks: generateLaneData(NBFCS[1], random, null) },
      { nbfc: NBFCS[2], blocks: generateLaneData(NBFCS[2], random, null) },
    ]
  } else if (scenario === 'Single Anomaly') {
    return [
      { nbfc: NBFCS[0], blocks: generateLaneData(NBFCS[0], random, null) },
      { nbfc: NBFCS[1], blocks: generateLaneData(NBFCS[1], random, 'Institution 2', 8) },
      { nbfc: NBFCS[2], blocks: generateLaneData(NBFCS[2], random, null) },
    ]
  } else {
    // Multi-NBFC Anomaly
    return [
      { nbfc: NBFCS[0], blocks: generateLaneData(NBFCS[0], random, null) },
      { nbfc: NBFCS[1], blocks: generateLaneData(NBFCS[1], random, 'Institution 2', 8) },
      { nbfc: NBFCS[2], blocks: generateLaneData(NBFCS[2], random, 'Institution 3', 14) },
    ]
  }
}

export default function NetworkScaleTab() {
  const [highlightNBFC, setHighlightNBFC] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [scenario, setScenario] = useState('Multi-NBFC Anomaly')
  const [lanesData, setLanesData] = useState(() => getScenarioData('Multi-NBFC Anomaly'))
  const [hoveredBlock, setHoveredBlock] = useState(null)
  
  const [progress, setProgress] = useState(-1)
  const intervalRef = useRef(null)

  const startSweep = () => {
    setProgress(-1)
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= BLOCKS_PER_LANE + 50) { // allow plenty of headroom for appended blocks
            clearInterval(intervalRef.current)
            return p
          }
          return p + 1
        })
      }, 35)
    }, 400)
  }

  useEffect(() => {
    setLanesData(getScenarioData(scenario))
    startSweep()
  }, [scenario])

  const totalBlocks = lanesData.reduce((sum, lane) => sum + lane.blocks.length, 0)
  const maxBlocksInLane = Math.max(...lanesData.map(l => l.blocks.length))
  const isFinished = progress >= maxBlocksInLane

  const simulateNewTranche = () => {
    setLanesData(prevLanes => {
      const newLanes = [...prevLanes]
      // Target NBFC 1, Institution 1 (always predictable)
      const targetLane = { ...newLanes[0], blocks: [...newLanes[0].blocks] }
      
      const clusterBlocks = targetLane.blocks.filter(b => b.institution === 'Institution 1')
      const lastBlockInCluster = clusterBlocks[clusterBlocks.length - 1]
      const insertionIndex = targetLane.blocks.indexOf(lastBlockInCluster) + 1
      
      // Use unseeded random for the single new block so it's fresh
      const amt = Math.floor(Math.random() * 50) * 1000 + 10000
      
      const newBlock = {
        id: `simulated-${Date.now()}`,
        laneId: NBFCS[0].id,
        nbfc: NBFCS[0],
        institution: 'Institution 1',
        amount: `₹${amt.toLocaleString()}`,
        milestone: 'Disbursement ' + Math.floor(Math.random() * 10),
        hash: Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        tampered: false,
        timestamp: new Date().toISOString()
      }

      // Add to the very end of the blockchain ledger for this lane
      targetLane.blocks.push(newBlock)
      
      // Re-index all blocks in the lane
      targetLane.blocks.forEach((b, i) => b.index = i)
      
      // If the global progress was finished, we pull it back slightly so the sweep animation catches this new block
      setProgress(p => {
        const newMax = Math.max(...newLanes.map(l => l.blocks.length))
        return p >= newMax - 1 ? newMax - 2 : p
      })
      
      newLanes[0] = targetLane
      return newLanes
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 0', height: '100%', position: 'relative' }}>
      
      <div className="glass-card" style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.6rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>The Network at Scale</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 800 }}>
            Watch the network verify every tranche from NBFC release to institution confirmation — live, across all three lending partners.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
          <StatBox label="Total Blocks" value={totalBlocks} />
          <StatBox label="Active NBFCs" value={3} />
          <StatBox label="Active Institutions" value={INSTITUTIONS.length} />
          <StatBox 
            label="Network Status" 
            value={!isFinished ? 'Verifying...' : (scenario === 'Clean Network' ? '✓ Secure & Verified' : '⚠ Anomalies Detected')} 
            color={!isFinished ? 'var(--text-primary)' : (scenario === 'Clean Network' ? 'var(--color-green)' : 'var(--color-red)')}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select label="Scenario" value={scenario} onChange={setScenario} options={['Clean Network', 'Single Anomaly', 'Multi-NBFC Anomaly']} />
          <Select label="Highlight Lane" value={highlightNBFC} onChange={setHighlightNBFC} options={['All', ...NBFCS.map(n => n.name)]} />
          <Select label="Status" value={filterStatus} onChange={setFilterStatus} options={['All', 'Valid Only', 'Flagged Only']} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="btn-secondary" 
            onClick={simulateNewTranche}
            style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <Plus size={14} /> Simulate New Tranche
          </button>
          <button 
            className="btn-primary" 
            onClick={startSweep}
            style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <Play size={14} /> Replay Verification
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 400 }}>
        {lanesData.map(lane => (
          <NbfcLane 
            key={lane.nbfc.id} 
            lane={lane} 
            progress={progress} 
            onHover={setHoveredBlock}
            filterStatus={filterStatus}
            isDimmed={highlightNBFC !== 'All' && highlightNBFC !== lane.nbfc.name}
          />
        ))}

        <AnimatePresence>
          {hoveredBlock && (
            <Tooltip block={hoveredBlock.block} state={hoveredBlock.state} pos={hoveredBlock.pos} />
          )}
        </AnimatePresence>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0 20px', fontStyle: 'italic' }}>
        Every block shown here is independently hash-linked and signature-verified within its respective institution cluster.
      </div>
    </div>
  )
}

function NbfcLane({ lane, progress, onHover, filterStatus, isDimmed }) {
  const [clusterPhases, setClusterPhases] = useState({}) // Maps cluster.name -> 'self_scanning' | 'consensus' | 'done'
  const [prevLengths, setPrevLengths] = useState({})

  const firstTamperedPerInst = useMemo(() => {
    const map = {}
    lane.blocks.forEach(b => {
      if (b.tampered && map[b.institution] === undefined) {
        map[b.institution] = b.index
      }
    })
    return map
  }, [lane.blocks])

  const clusters = useMemo(() => {
    const map = {}
    INSTITUTIONS.forEach(inst => map[inst] = [])
    lane.blocks.forEach(b => map[b.institution].push(b))
    return Object.entries(map).map(([name, blocks]) => ({ name, blocks }))
  }, [lane.blocks])

  // Watch for newly appended blocks in a cluster to reset its animation phase
  useEffect(() => {
    const nextLengths = {}
    let phaseResetTriggered = false
    
    clusters.forEach(cluster => {
      const currentLen = cluster.blocks.length
      nextLengths[cluster.name] = currentLen
      
      if (prevLengths[cluster.name] && currentLen > prevLengths[cluster.name]) {
        // A block was appended to this specific cluster. Reset its phase so it re-runs.
        setClusterPhases(p => {
          const next = { ...p }
          delete next[cluster.name]
          return next
        })
        phaseResetTriggered = true
      }
    })
    
    if (phaseResetTriggered) {
      setPrevLengths(nextLengths)
    } else if (Object.keys(prevLengths).length === 0) {
      // initialize
      setPrevLengths(nextLengths)
    }
  }, [clusters, prevLengths])

  // Phase transition logic driven by progress (or lack of phase)
  useEffect(() => {
    if (progress === -1) {
      setClusterPhases({})
      return
    }
    
    clusters.forEach(cluster => {
      const lastIdx = cluster.blocks[cluster.blocks.length - 1].index
      
      if (progress > lastIdx) {
        setClusterPhases(prev => {
          if (!prev[cluster.name]) {
            setTimeout(() => {
              setClusterPhases(p => ({ ...p, [cluster.name]: 'consensus' }))
              setTimeout(() => {
                setClusterPhases(p => ({ ...p, [cluster.name]: 'done' }))
              }, 1400) // consensus takes 1.4s
            }, 600) // self_scan takes 600ms
            
            return { ...prev, [cluster.name]: 'self_scanning' }
          }
          return prev
        })
      }
    })
  }, [progress, clusters])

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: lane.nbfc.color, boxShadow: `0 0 10px ${lane.nbfc.color}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{lane.nbfc.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{lane.blocks.length} tranches</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))',
          gap: 6,
          alignContent: 'start',
        }}>
          {clusters.map(cluster => (
            <React.Fragment key={cluster.name}>
              <div style={{ 
                gridColumn: '1 / -1', fontSize: '0.65rem', color: 'var(--text-secondary)', 
                textTransform: 'uppercase', letterSpacing: '0.05em', 
                borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 4, marginTop: 8 
              }}>
                → {cluster.name}
              </div>

              {cluster.blocks.map(block => {
                let state = 'pending'
                const firstTamperIdx = firstTamperedPerInst[block.institution]
                const phase = clusterPhases[cluster.name] || 'waiting'

                if (progress >= block.index) {
                  if (firstTamperIdx !== undefined && block.index > firstTamperIdx) {
                    state = 'broken_downstream'
                  } else if (firstTamperIdx !== undefined && block.index === firstTamperIdx) {
                    state = 'tampered'
                  } else {
                    state = 'valid'
                  }
                }

                const isFlagged = state === 'tampered' || state === 'broken_downstream'
                if (filterStatus === 'Valid Only' && (isFlagged || state === 'pending')) return null
                if (filterStatus === 'Flagged Only' && !isFlagged) return null

                return (
                  <BlockTile 
                    key={block.id} 
                    block={block} 
                    state={state}
                    phase={phase}
                    isActivelySweeping={progress === block.index}
                    onHover={(pos) => onHover({ block, state, pos })}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8, textAlign: 'center' }}>
          Endpoint: Partner Institutions
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {clusters.map(cluster => {
            const firstTamperIdx = firstTamperedPerInst[cluster.name]
            const isTampered = firstTamperIdx !== undefined
            const totalBlocks = cluster.blocks.length
            const phase = clusterPhases[cluster.name] || 'waiting'
            
            let statusBadge = null
            
            if (phase === 'waiting' || phase === 'self_scanning') {
              statusBadge = <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{phase === 'waiting' ? 'Awaiting...' : 'Checking local ledger...'}</span>
            } else if (phase === 'consensus') {
              statusBadge = <ConsensusIndicator isTampered={isTampered} />
            } else if (phase === 'done') {
              if (isTampered) {
                const clusterStartIdx = cluster.blocks[0].index
                const badCount = totalBlocks - (firstTamperIdx - clusterStartIdx)
                statusBadge = <span style={{ color: 'var(--color-amber)' }}>⚠ Cannot confirm {badCount} tranches</span>
              } else {
                statusBadge = <span style={{ color: 'var(--color-green)' }}>✓ {totalBlocks} tranches verified</span>
              }
            }

            return (
              <div key={cluster.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', minHeight: 28 }}>
                <span style={{ color: 'var(--text-primary)' }}>{cluster.name}</span>
                {statusBadge}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ConsensusIndicator({ isTampered }) {
  const finalColor = isTampered ? '#f59e0b' : '#10b981'; // amber or green
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 16 }}>
      <NodeDot label="NBFC Node" popDelay={0.1} isDissent={false} finalColor={finalColor} />
      <NodeDot label="Platform Node" popDelay={0.4} isDissent={false} finalColor={finalColor} />
      <NodeDot label="Institution Node" popDelay={0.7} isDissent={isTampered} finalColor={finalColor} />
    </div>
  )
}

function NodeDot({ label, popDelay, isDissent, finalColor }) {
  const popColor = isDissent ? '#ef4444' : '#4b5563'; // red or gray
  return (
    <motion.div
      initial={{ scale: 0, backgroundColor: popColor }}
      animate={{ 
        scale: [0, 1.2, 1],
        backgroundColor: [popColor, finalColor]
      }}
      transition={{
        scale: { delay: popDelay, duration: 0.3 },
        backgroundColor: { delay: 1.1, duration: 0.2 } // Converge all together
      }}
      style={{ width: 8, height: 8, borderRadius: '50%' }}
      title={label}
    />
  )
}

function StatBox({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>{label}</span>
      <motion.span 
        key={value}
        initial={{ scale: 1.2, color: 'var(--color-green)' }}
        animate={{ scale: 1, color }}
        transition={{ duration: 0.5 }}
        style={{ fontSize: '1.2rem', fontWeight: 800, color }}
      >
        {value}
      </motion.span>
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

function BlockTile({ block, state, phase, isActivelySweeping, onHover }) {
  const isTampered = state === 'tampered'
  const isSelfScanning = phase === 'self_scanning' && state !== 'pending'
  
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

      {/* Primary Sweeping pulse effect */}
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

      {/* Secondary self-scan sweep effect */}
      <AnimatePresence>
        {isSelfScanning && state === 'valid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.4, delay: (block.index % 21) * 0.02 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 4,
              background: 'var(--color-teal)', zIndex: 2
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Time:</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {new Date(block.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
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
