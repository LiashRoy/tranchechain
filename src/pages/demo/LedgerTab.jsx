import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoJS from 'crypto-js'

/* ═══════════════════════════════════════════════════════════════════════════
   CRYPTO & DATA UTILITIES
═══════════════════════════════════════════════════════════════════════════ */

const sha256 = (str) => CryptoJS.SHA256(str).toString()
const GENESIS_PREV = '0'.repeat(64)
const LOAN_ID = 'EDU-2024-001'

const blockContent = ({ from, to, amount, milestone, timestamp, prevHash }) =>
  `${LOAN_ID}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`

const computeHash = (block) => sha256(blockContent(block))

const trunc = (h = '', n = 12) => `${h.slice(0, n)}…`

const fmtAmount = (v) => {
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10)
  if (isNaN(n)) return v
  return `₹${n.toLocaleString('en-IN')}`
}

let _uid = 100
const uid = () => `block-${++_uid}-${Date.now()}`

/* ═══════════════════════════════════════════════════════════════════════════
   ENTITY METADATA
═══════════════════════════════════════════════════════════════════════════ */

const ENTITIES = {
  'NBFC 1':          { color: '#3b8cff', bg: 'rgba(59,140,255,0.15)',  initials: 'N1', type: 'nbfc' },
  'NBFC 2':          { color: '#14b8a6', bg: 'rgba(20,184,166,0.15)',  initials: 'N2', type: 'nbfc' },
  'NBFC 3':       { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)',initials: 'N3', type: 'nbfc' },
  'Fintech Company':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', initials: 'GQ', type: 'platform' },
  'Partner Institute':      { color: '#10b981', bg: 'rgba(16,185,129,0.15)', initials: 'PI', type: 'institution' },
  'BITS Pilani':          { color: '#f87171', bg: 'rgba(248,113,113,0.15)',initials: 'BP', type: 'institution' },
  'IIM Bangalore':        { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', initials: 'IB', type: 'institution' },
}

const FROM_OPTIONS = ['NBFC 1', 'NBFC 2', 'NBFC 3']
const TO_OPTIONS   = ['Fintech Company', 'Partner Institute', 'BITS Pilani', 'IIM Bangalore']
const MILESTONES   = ['Admission Confirmed', 'Semester 1 Start', 'Semester 2 Start', 'Final Disbursement']

/* ═══════════════════════════════════════════════════════════════════════════
   INITIAL CHAIN (real hashes, computed at module load)
═══════════════════════════════════════════════════════════════════════════ */

function makeBlock(data, prevHash) {
  const b = { ...data, prevHash }
  return { ...b, hash: computeHash(b), status: 'valid', wasTampered: false, id: uid() }
}

function buildInitialChain() {
  const b1 = makeBlock({
    from: 'NBFC 1', to: 'Partner Institute',
    amount: '₹18,000', milestone: 'Admission Confirmed',
    timestamp: '2024-06-01 09:14', index: 1,
  }, GENESIS_PREV)

  const b2 = makeBlock({
    from: 'NBFC 2', to: 'Partner Institute',
    amount: '₹24,000', milestone: 'Semester 1 Start',
    timestamp: '2024-10-02 11:22', index: 2,
  }, b1.hash)

  const b3 = makeBlock({
    from: 'NBFC 3', to: 'Partner Institute',
    amount: '₹24,000', milestone: 'Semester 2 Start',
    timestamp: '2025-02-01 08:45', index: 3,
  }, b2.hash)

  return [b1, b2, b3]
}

const INITIAL_CHAIN = buildInitialChain()

/* ═══════════════════════════════════════════════════════════════════════════
   CHAIN VALIDATION
═══════════════════════════════════════════════════════════════════════════ */

function validateChain(blocks) {
  return blocks.map((block, i) => {
    if (block.wasTampered) return { ...block, status: 'tampered' }
    if (i === 0) return { ...block, status: 'valid' }
    const prev = blocks[i - 1]
    if (block.prevHash !== prev.hash) return { ...block, status: 'invalid' }
    return { ...block, status: 'valid' }
  })
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function EntityBadge({ name, size = 28 }) {
  const meta = ENTITIES[name] || { color: '#7a8fb0', bg: 'rgba(122,143,176,0.15)', initials: '??' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{
        width: size, height: size, borderRadius: '7px',
        background: meta.bg, border: `1px solid ${meta.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
        fontSize: `${size * 0.35}px`, color: meta.color,
        flexShrink: 0,
      }}>
        {meta.initials}
      </div>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 600,
        fontSize: '0.78rem', color: '#b8c9df',
      }}>{name}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    valid:    { label: '✓ Valid',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
    tampered: { label: '⚠ Tampered', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    invalid:  { label: '✗ Broken',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)' },
  }
  const s = cfg[status] || cfg.valid
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '999px',
      background: s.bg, border: `1px solid ${s.border}`,
      fontFamily: 'Manrope, sans-serif', fontWeight: 700,
      fontSize: '0.68rem', color: s.color, letterSpacing: '0.02em',
    }}>{s.label}</span>
  )
}

function HashField({ label, value, color = '#14b8a6' }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
        color: color, opacity: 0.7, textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: '3px',
      }}>{label}</div>
      <div
        onClick={() => setExpanded(e => !e)}
        title={expanded ? 'Click to collapse' : 'Click to expand full hash'}
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color, background: `${color}0d`,
          border: `1px solid ${color}20`, borderRadius: '6px',
          padding: '4px 8px', wordBreak: 'break-all', lineHeight: 1.4,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}1a` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}0d` }}
      >
        <motion.span
          key={expanded ? 'full' : 'trunc'}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {expanded ? value : trunc(value)}
        </motion.span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAIN CONNECTOR
═══════════════════════════════════════════════════════════════════════════ */

function ChainConnector({ broken, pulsing, isMobile }) {
  return (
    <div style={{
      width: isMobile ? '100%' : 48,
      height: isMobile ? 48 : 'auto',
      flexShrink: 0,
      display: 'flex', flexDirection: isMobile ? 'row' : 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 4, paddingTop: isMobile ? 0 : 60,
      position: 'relative',
    }}>
      <motion.div
        animate={broken ? {
          [isMobile ? 'x' : 'y']: [0, -3, 3, -2, 2, 0],
          transition: { duration: 0.4, delay: 0.1 },
        } : {}}
        style={{ 
          width: isMobile ? 2 : '100%', 
          height: isMobile ? '100%' : 2, 
          display: 'flex', 
          flexDirection: isMobile ? 'row' : 'column', 
          alignItems: 'center', 
          gap: 3 
        }}
      >
        {/* Line */}
        <div style={{
          width: isMobile ? 2 : '100%', 
          height: isMobile ? '100%' : 2, 
          borderRadius: 1,
          background: broken
            ? 'rgba(239,68,68,0.5)'
            : `linear-gradient(${isMobile ? '180deg' : '90deg'}, rgba(20,184,166,0.5), rgba(59,140,255,0.5))`,
          transition: 'background 0.4s ease',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Travelling pulse when not broken */}
          {!broken && (
            <motion.div
              animate={isMobile ? { y: ['-100%', '200%'] } : { x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: isMobile ? '100%' : '40%', 
                height: isMobile ? '40%' : '100%',
                background: `linear-gradient(${isMobile ? '180deg' : '90deg'}, transparent, rgba(255,255,255,0.6), transparent)`,
              }}
            />
          )}
        </div>

        {/* Arrow head */}
        <svg 
          width={isMobile ? 10 : 8} 
          height={isMobile ? 8 : 10} 
          viewBox={isMobile ? "0 0 10 8" : "0 0 8 10"} 
          style={{ 
            [isMobile ? 'marginTop' : 'marginLeft']: isMobile ? '30px' : '30px', 
            [isMobile ? 'marginLeft' : 'marginTop']: isMobile ? '-6px' : '-6px' 
          }}
        >
          {isMobile ? (
            <path d="M0 0L5 8L10 0" fill="none"
              stroke={broken ? 'rgba(239,68,68,0.5)' : 'rgba(20,184,166,0.5)'}
              strokeWidth="1.5" strokeLinecap="round"
            />
          ) : (
            <path d="M0 0L8 5L0 10" fill="none"
              stroke={broken ? 'rgba(239,68,68,0.5)' : 'rgba(20,184,166,0.5)'}
              strokeWidth="1.5" strokeLinecap="round"
            />
          )}
        </svg>

        {/* Crack icon when broken */}
        {broken && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ fontSize: '0.9rem', lineHeight: 1, marginTop: 2, marginLeft: isMobile ? 8 : 0 }}
          >💥</motion.div>
        )}
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK CARD
═══════════════════════════════════════════════════════════════════════════ */

function BlockCard({ block, isNew, visiblyInvalid, onTamper }) {
  const effectiveStatus = visiblyInvalid ? (block.status === 'invalid' ? 'invalid' : block.status) : (block.status === 'invalid' ? 'valid' : block.status)

  const borderColor =
    effectiveStatus === 'invalid'  ? 'rgba(239,68,68,0.45)'  :
    effectiveStatus === 'tampered' ? 'rgba(245,158,11,0.45)' :
    'rgba(59,140,255,0.18)'

  const headerGlow =
    effectiveStatus === 'invalid'  ? 'rgba(239,68,68,0.07)'  :
    effectiveStatus === 'tampered' ? 'rgba(245,158,11,0.07)' :
    'rgba(59,140,255,0.05)'

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: 80, scale: 0.85 } : false}
      animate={
        visiblyInvalid && block.status === 'invalid'
          ? { opacity: 1, x: [0, -5, 5, -3, 3, 0], scale: 1, transition: { x: { duration: 0.4 } } }
          : { opacity: 1, x: 0, scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ width: 238, flexShrink: 0 }}
    >
      <div style={{
        borderRadius: 13,
        border: `1.5px solid ${borderColor}`,
        background: 'rgba(15,26,46,0.72)',
        backdropFilter: 'blur(14px)',
        overflow: 'hidden',
        transition: 'border-color 0.4s ease',
        boxShadow: effectiveStatus === 'invalid' ? '0 0 20px rgba(239,68,68,0.1)' :
                   effectiveStatus === 'tampered' ? '0 0 20px rgba(245,158,11,0.1)' :
                   '0 4px 20px rgba(0,0,0,0.25)',
      }}>

        {/* Card header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${borderColor}`,
          background: headerGlow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: effectiveStatus === 'invalid' ? '#ef4444' :
                          effectiveStatus === 'tampered' ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 6px ${effectiveStatus === 'invalid' ? '#ef444480' :
                           effectiveStatus === 'tampered' ? '#f59e0b80' : '#10b98180'}`,
              transition: 'background 0.4s, box-shadow 0.4s',
            }} />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.68rem', color: '#7a8fb0',
            }}>Block #{block.index}</span>
          </div>
          <StatusBadge status={effectiveStatus} />
        </div>

        {/* Body */}
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* From → To */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <EntityBadge name={block.from} />
            <div style={{ paddingLeft: 8, color: '#243352', fontSize: '0.7rem' }}>↓</div>
            <EntityBadge name={block.to} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(59,140,255,0.08)' }} />

          {/* Amount + Milestone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              fontSize: '1.12rem', color: '#10b981', letterSpacing: '-0.01em',
            }}>
              {block.amount}
            </div>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem',
              color: '#a78bfa', fontWeight: 500,
            }}>{block.milestone}</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
              color: '#243352',
            }}>{block.timestamp}</div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(59,140,255,0.08)' }} />

          {/* Hashes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <HashField label="prev_hash" value={block.prevHash} color="#f59e0b" />
            <HashField label="this_hash" value={block.hash}    color="#14b8a6" />
          </div>
        </div>

        {/* Footer: tamper button */}
        <div style={{
          padding: '8px 14px',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex', justifyContent: 'flex-end',
          transition: 'border-color 0.4s',
        }}>
          <button
            onClick={() => onTamper(block)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.22)',
              color: '#fbbf24', fontFamily: 'Manrope, sans-serif',
              fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.16)'
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.08)'
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.22)'
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Tamper
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAMPER MODAL
═══════════════════════════════════════════════════════════════════════════ */

function TamperModal({ block, onSave, onClose }) {
  const [amount, setAmount] = useState(block.amount.replace('₹', '').replace(/,/g, ''))

  const handleSave = () => {
    const formatted = fmtAmount(amount)
    if (formatted === block.amount) { onClose(); return }
    onSave(block.id, formatted)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(4,8,15,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(15,26,46,0.95)',
          border: '1.5px solid rgba(245,158,11,0.3)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(245,158,11,0.15)',
          background: 'rgba(245,158,11,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 700,
              fontSize: '0.95rem', color: '#fbbf24',
            }}>Tamper with Block #{block.index}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#7a8fb0',
              cursor: 'pointer', fontSize: '1.1rem', padding: 4,
            }}
          >✕</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px' }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem',
            color: '#7a8fb0', lineHeight: 1.6, marginBottom: 20,
          }}>
            You are about to alter the <strong style={{ color: '#fbbf24' }}>amount</strong> in Block #{block.index}.
            This will change the block's fingerprint — breaking every block after it.
            This demonstrates <strong style={{ color: '#3b8cff' }}>Layer 2 tamper protection</strong>.
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              color: '#7a8fb0', textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 6,
            }}>Current amount</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem',
              color: '#10b981', fontWeight: 700,
            }}>{block.amount}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 6,
            }}>New amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              style={{
                width: '100%', boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem',
                background: 'rgba(245,158,11,0.08)',
                border: '1.5px solid rgba(245,158,11,0.35)',
                borderRadius: 9, padding: '10px 14px',
                color: '#fbbf24', outline: 'none',
              }}
              autoFocus
              onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.7)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(245,158,11,0.35)' }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1, padding: '11px', borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.12))',
                border: '1.5px solid rgba(239,68,68,0.4)',
                color: '#f87171', fontFamily: 'Manrope, sans-serif',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.12))' }}
            >
              🔨 Save & Break Chain
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '11px 18px', borderRadius: 9,
                background: 'transparent',
                border: '1px solid rgba(59,140,255,0.2)',
                color: '#7a8fb0', fontFamily: 'Manrope, sans-serif',
                fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD BLOCK SIDEBAR
═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_FORM = { from: '', to: '', milestone: '', amount: '' }

const selectStyle = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem',
  background: 'rgba(59,140,255,0.06)',
  border: '1px solid rgba(59,140,255,0.2)',
  borderRadius: 9, padding: '9px 12px',
  color: '#d4e0ef', outline: 'none', cursor: 'pointer',
  appearance: 'none',
}

function AddBlockSidebar({ blocks, onAdd, addPhase }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [shakeKey, setShakeKey] = useState(0)
  const hashPreview = useRef('')

  const usedMilestones = new Set(blocks.map(b => b.milestone))

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (error) setError(null)
  }

  const handleSubmit = () => {
    if (!form.from || !form.to || !form.milestone || !form.amount) {
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
    if (usedMilestones.has(form.milestone)) {
      setError('Tranche already disbursed — duplicate rejected.')
      setShakeKey(k => k + 1)
      return
    }
    onAdd({
      from: form.from,
      to: form.to,
      milestone: form.milestone,
      amount: fmtAmount(form.amount),
    })
    setForm(EMPTY_FORM)
    setError(null)
  }

  const isComputing = addPhase === 'computing'
  const isSigning   = addPhase === 'signing'
  const busy        = addPhase !== 'idle'

  const btnLabel =
    isComputing ? '⚙ Computing SHA-256…' :
    isSigning   ? '🔏 Signing with private key…' :
    addPhase === 'done' ? '✓ Block added!' :
    '⛓ Sign & Add Block'

  const btnColor =
    isComputing ? '#6aaeff' :
    isSigning   ? '#14b8a6' :
    addPhase === 'done' ? '#10b981' :
    '#3b8cff'

  return (
    <div style={{
      width: 300, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="glass-card"
        style={{ padding: '20px 18px' }}
      >
        {/* Sidebar heading */}
        <div style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 700,
          fontSize: '0.9rem', color: '#d4e0ef', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⛓</span> Add New Tranche
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {/* From */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: '#7a8fb0', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>From (NBFC Node)</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.from}
                onChange={e => set('from', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">Select NBFC…</option>
                {FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a8fb0" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* To */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: '#7a8fb0', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>To (Institution / Platform)</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.to}
                onChange={e => set('to', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">Select recipient…</option>
                {TO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a8fb0" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* Milestone */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: '#7a8fb0', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>Milestone</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.milestone}
                onChange={e => set('milestone', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">Select milestone…</option>
                {MILESTONES.map(m => (
                  <option key={m} value={m} disabled={usedMilestones.has(m)}>
                    {m}{usedMilestones.has(m) ? ' ✓ disbursed' : ''}
                  </option>
                ))}
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a8fb0" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: '#7a8fb0', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>Amount (₹)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="e.g. 24000"
              disabled={busy}
              style={{
                width: '100%', boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 9, padding: '9px 12px',
                color: '#10b981', outline: 'none',
                opacity: busy ? 0.5 : 1,
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(16,185,129,0.2)' }}
              onKeyDown={e => { if (e.key === 'Enter' && !busy) handleSubmit() }}
            />
          </div>

          {/* Hash preview during computing phase */}
          <AnimatePresence>
            {isComputing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
                  color: '#7a8fb0', textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 4,
                }}>Computing fingerprint…</div>
                <motion.div
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    height: 28, borderRadius: 6,
                    background: 'linear-gradient(90deg, rgba(59,140,255,0.12), rgba(20,184,166,0.2), rgba(59,140,255,0.12))',
                    backgroundSize: '200% 100%',
                  }}
                />
              </motion.div>
            )}
            {isSigning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(20,184,166,0.08)',
                  border: '1px solid rgba(20,184,166,0.25)',
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ fontSize: '1.1rem' }}
                >🔏</motion.span>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
                  color: '#14b8a6',
                }}>Applying digital signature (wax seal)…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key={error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
                  color: '#f87171', lineHeight: 1.4,
                }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            disabled={busy}
            animate={busy ? { opacity: 0.85 } : { opacity: 1 }}
            whileHover={!busy ? { scale: 1.02, y: -1 } : {}}
            whileTap={!busy ? { scale: 0.98 } : {}}
            style={{
              width: '100%', padding: '11px',
              borderRadius: 9, border: 'none',
              background: busy
                ? `linear-gradient(135deg, ${btnColor}30, ${btnColor}18)`
                : `linear-gradient(135deg, ${btnColor}, ${btnColor}cc)`,
              color: busy ? btnColor : '#fff',
              fontFamily: 'Manrope, sans-serif', fontWeight: 700,
              fontSize: '0.85rem', cursor: busy ? 'wait' : 'pointer',
              transition: 'background 0.3s, color 0.3s',
              border: busy ? `1px solid ${btnColor}40` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {busy && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block', fontSize: '0.9rem' }}
              >⚙</motion.span>
            )}
            {btnLabel}
          </motion.button>
        </div>
      </motion.div>

      {/* Info card */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
          color: '#3b8cff', textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 7,
        }}>Loan Reference</div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem',
          color: '#6aaeff', marginBottom: 10,
        }}>{LOAN_ID}</div>
        <div style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.74rem',
          color: '#7a8fb0', lineHeight: 1.55,
        }}>
          Each disbursement milestone can only appear once in the chain.
          Attempting to re-add a disbursed milestone will be rejected as a
          double-disbursal (duplicate tranche protection).
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATS BAR
═══════════════════════════════════════════════════════════════════════════ */

function StatsBar({ blocks, onReset }) {
  const valid   = blocks.filter(b => b.status === 'valid').length
  const broken  = blocks.filter(b => b.status === 'invalid' || b.status === 'tampered').length
  const isClean = broken === 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 20px', borderRadius: 12,
      background: isClean ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
      border: `1px solid ${isClean ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      transition: 'all 0.4s ease',
      flexWrap: 'wrap',
    }}>
      {/* Status dot */}
      <motion.div
        animate={isClean ? {} : { scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
          background: isClean ? '#10b981' : '#ef4444',
          boxShadow: `0 0 8px ${isClean ? '#10b98180' : '#ef444480'}`,
          transition: 'background 0.4s, box-shadow 0.4s',
        }}
      />

      {[
        { label: 'Chain Length', value: `${blocks.length}` },
        { label: 'Valid Blocks', value: `${valid}`, color: '#10b981' },
        { label: 'Status', value: isClean ? '✓ Verified' : '⚠ Compromised',
          color: isClean ? '#10b981' : '#ef4444' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#7a8fb0',
          }}>{s.label}:</span>
          <motion.span
            key={s.value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              fontSize: '0.82rem', color: s.color || '#d4e0ef',
            }}
          >{s.value}</motion.span>
        </div>
      ))}

      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(59,140,255,0.1)',
            border: '1px solid rgba(59,140,255,0.25)',
            color: '#6aaeff', fontFamily: 'Manrope, sans-serif',
            fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,140,255,0.18)'
            e.currentTarget.style.borderColor = 'rgba(59,140,255,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,140,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(59,140,255,0.25)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset Chain
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAMPER BANNER
═══════════════════════════════════════════════════════════════════════════ */

function TamperBanner({ info, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', borderRadius: 10,
        background: 'rgba(239,68,68,0.1)',
        border: '1.5px solid rgba(239,68,68,0.35)',
        gap: 10, flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ fontSize: '1.1rem' }}
        >⚠️</motion.span>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 600,
          fontSize: '0.84rem', color: '#f87171',
        }}>
          Tamper detected — chain integrity broken from Tranche #{info.fromTranche} onward.
          {' '}
          <span style={{ fontWeight: 400, color: '#ef444490' }}>
            The ledger fingerprint chain has been compromised.
          </span>
        </span>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', color: '#ef444460',
          cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
          padding: '2px 6px',
        }}
      >Dismiss</button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LEDGER PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function LedgerTab({ blocks, setBlocks }) {
  const [visibleInvalid, setVisibleInvalid] = useState(new Set())
  const [tamperModal, setTamperModal] = useState(null)
  const [addPhase, setAddPhase] = useState('idle')
  const [bannerInfo, setBannerInfo] = useState(null)
  const [newestId, setNewestId] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const chainRef = useRef(null)
  const addTimers = useRef([])

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-scroll chain to end when new block added
  useEffect(() => {
    if (newestId && chainRef.current) {
      setTimeout(() => {
        if (isMobile) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        } else {
          chainRef.current?.scrollTo({ left: chainRef.current.scrollWidth, behavior: 'smooth' })
        }
      }, 200)
    }
  }, [newestId, isMobile])

  // Cleanup timers on unmount
  useEffect(() => () => addTimers.current.forEach(clearTimeout), [])

  /* ── ADD BLOCK ─────────────────────────────────────────────────── */
  const handleAdd = useCallback((formData) => {
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
        })
        setAddPhase('done')
        addTimers.current.push(setTimeout(() => {
          setAddPhase('idle')
          setNewestId(null)
        }, 900))
      }, 650))
    }, 820))
  }, [])

  /* ── TAMPER ────────────────────────────────────────────────────── */
  const handleTamperSave = useCallback((blockId, newAmount) => {
    setTamperModal(null)
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId)
      if (idx < 0) return prev

      // Recompute tampered block
      const tampered = { ...prev[idx], amount: newAmount, wasTampered: true }
      tampered.hash = computeHash(tampered)
      tampered.status = 'tampered'

      // Rebuild subsequent blocks' statuses (don't re-link prevHash — that's the point)
      const updated = prev.map((b, i) => i === idx ? tampered : b)
      const validated = validateChain(updated)

      // Show banner
      setBannerInfo({ fromTranche: idx + 1 })

      // Cascade visibleInvalid with stagger
      setVisibleInvalid(new Set([idx]))   // tampered block visible immediately
      let step = idx + 1
      const cascadeLen = validated.length - step
      for (let d = 0; d < cascadeLen; d++) {
        const capturedStep = step + d
        addTimers.current.push(setTimeout(() => {
          setVisibleInvalid(prev2 => new Set([...prev2, capturedStep]))
        }, 280 + d * 220))
      }

      return validated
    })
  }, [])

  /* ── RESET ─────────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setBlocks(buildInitialChain())
    setVisibleInvalid(new Set())
    setBannerInfo(null)
    setNewestId(null)
    addTimers.current.forEach(clearTimeout)
    addTimers.current = []
  }, [])

  /* ── Determine connector break state ───────────────────────────── */
  const isConnectorBroken = (leftBlock, rightBlock, rightIdx) => {
    if (rightBlock.status === 'invalid' && visibleInvalid.has(rightIdx)) return true
    return false
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <div style={{ padding: '28px 24px 0', maxWidth: 1300, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>


        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsBar blocks={blocks} onReset={handleReset} />
        </motion.div>

        {/* Tamper banner */}
        <AnimatePresence>
          {bannerInfo && (
            <motion.div style={{ marginTop: 14 }}>
              <TamperBanner info={bannerInfo} onDismiss={() => setBannerInfo(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1, display: 'flex', gap: 24,
        padding: '20px 24px 40px',
        maxWidth: 1300, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>

        {/* ── CHAIN PANEL ───────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            ref={chainRef}
            style={{
              overflowX: isMobile ? 'visible' : 'auto',
              paddingBottom: 12,
            }}
          >
            <motion.div
              layout
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'center' : 'flex-start',
                gap: 0,
                minWidth: isMobile ? 'auto' : 'max-content',
                paddingBottom: 4,
              }}
            >
              <AnimatePresence initial={false}>
                {blocks.map((block, i) => (
                  <div key={block.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start' }}>
                    <BlockCard
                      block={block}
                      isNew={block.id === newestId}
                      visiblyInvalid={visibleInvalid.has(i)}
                      onTamper={(b) => setTamperModal(b)}
                    />
                    {i < blocks.length - 1 && (
                      <ChainConnector
                        broken={isConnectorBroken(block, blocks[i + 1], i + 1)}
                        isMobile={isMobile}
                      />
                    )}
                  </div>
                ))}
              </AnimatePresence>

              {/* "Adding..." ghost block */}
              <AnimatePresence>
                {addPhase === 'computing' || addPhase === 'signing' ? (
                  <motion.div
                    key="ghost"
                    initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, x: 40 }}
                    animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
                    exit={isMobile ? { opacity: 0, y: -20 } : { opacity: 0, x: -20 }}
                    style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start' }}
                  >
                    <div style={{ 
                      width: isMobile ? '100%' : 48, 
                      height: isMobile ? 48 : 'auto', 
                      flexShrink: 0, 
                      paddingTop: isMobile ? 0 : 60, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <div style={{ 
                        width: isMobile ? 2 : '100%', 
                        height: isMobile ? '100%' : 2, 
                        background: 'rgba(59,140,255,0.2)', 
                        borderRadius: 1 
                      }} />
                    </div>
                    <div style={{
                      width: 238, flexShrink: 0, borderRadius: 13,
                      border: '1.5px dashed rgba(59,140,255,0.25)',
                      background: 'rgba(15,26,46,0.4)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59,140,255,0.1)' }}>
                        <div style={{
                          height: 14, borderRadius: 4,
                          background: 'rgba(59,140,255,0.1)',
                          width: '60%',
                        }} />
                      </div>
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[80, 60, 70, 45].map((w, i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                            style={{
                              height: 12, borderRadius: 4,
                              background: 'rgba(59,140,255,0.1)',
                              width: `${w}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Scroll hint */}
          {blocks.length > 2 && !isMobile && (
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.72rem',
              color: '#243352', textAlign: 'center',
            }}>
              ← scroll chain horizontally · click any hash to expand
            </div>
          )}
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <div style={{ 
          width: isMobile ? '100%' : 300, 
          flexShrink: 0, 
          display: 'flex', flexDirection: 'column', gap: 16 
        }}>
          <AddBlockSidebar
            blocks={blocks}
            onAdd={handleAdd}
            addPhase={addPhase}
          />
        </div>
      </div>

      {/* Tamper modal */}
      <AnimatePresence>
        {tamperModal && (
          <TamperModal
            block={tamperModal}
            onSave={handleTamperSave}
            onClose={() => setTamperModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
