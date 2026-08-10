import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoJS from 'crypto-js'
import { useIsMobile } from '../../hooks/useIsMobile'

/* ═══════════════════════════════════════════════════════════════════════════
   CRYPTO & DATA UTILITIES
═══════════════════════════════════════════════════════════════════════════ */

const sha256 = (str) => CryptoJS.SHA256(str).toString()
const GENESIS_PREV = '0'.repeat(64)
const LOAN_ID = 'EDU-2024-001'

const blockContent = ({ from, to, amount, milestone, timestamp, prevHash, transaction_type }) =>
  `${LOAN_ID}||${transaction_type || 'disbursement'}||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`

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
  'NBFC 1':          { color: 'var(--color-electric-blue)', bg: 'var(--nav-border)',  initials: 'N1', type: 'nbfc' },
  'NBFC 2':          { color: 'var(--color-teal)', bg: 'rgba(20,184,166,0.15)',  initials: 'N2', type: 'nbfc' },
  'NBFC 3':       { color: 'var(--color-electric-blue)', bg: 'rgba(167,139,250,0.15)',initials: 'N3', type: 'nbfc' },
  'Fintech Company':   { color: 'var(--color-gold)', bg: 'rgba(245,158,11,0.15)', initials: 'GQ', type: 'platform' },
  'Partner Institute':      { color: 'var(--color-green)', bg: 'rgba(16,185,129,0.15)', initials: 'PI', type: 'institution' },
  'BITS Pilani':          { color: 'var(--color-red)', bg: 'rgba(248,113,113,0.15)',initials: 'BP', type: 'institution' },
  'IIM Bangalore':        { color: 'var(--color-gold)', bg: 'rgba(251,191,36,0.15)', initials: 'IB', type: 'institution' },
}

const FROM_OPTIONS = ['NBFC 1', 'NBFC 2', 'NBFC 3']
const TO_OPTIONS   = ['Fintech Company', 'Partner Institute']
const MILESTONES   = ['Admission Confirmed', 'Semester 1 Start', 'Semester 2 Start', 'Semester 3 Start', 'Semester 4 Start', 'Semester 5 Start', 'Final Disbursement']
const REFUND_REASONS = ['Mid-Semester Withdrawal', 'Course Cancellation', 'Overpayment Correction']
const REFUND_FROM_OPTIONS = ['Partner Institute', 'Fintech Company']
const REFUND_TO_OPTIONS = ['NBFC 1', 'NBFC 2', 'NBFC 3']

/* ═══════════════════════════════════════════════════════════════════════════
   INITIAL CHAIN (real hashes, computed at module load)
═══════════════════════════════════════════════════════════════════════════ */

function makeBlock({ transaction_type = 'disbursement', reason, refundRef, ...data }, prevHash) {
  data.transaction_type = transaction_type;
  if (reason) data.reason = reason;
  if (refundRef) data.refundRef = refundRef;
  const b = { ...data, prevHash }
  return { ...b, hash: computeHash(b), status: 'valid', wasTampered: false, id: uid() }
}

function buildInitialChain() {
  const b1 = makeBlock({
    from: 'NBFC 1', to: 'Partner Institute',
    amount: '₹18,000', milestone: 'Admission Confirmed', transaction_type: 'disbursement',
    timestamp: '2024-06-01 09:14', index: 1,
  }, GENESIS_PREV)

  const b2 = makeBlock({
    from: 'NBFC 2', to: 'Partner Institute',
    amount: '₹24,000', milestone: 'Semester 1 Start', transaction_type: 'disbursement',
    timestamp: '2024-10-02 11:22', index: 2,
  }, b1.hash)

  const b3 = makeBlock({
    from: 'NBFC 3', to: 'Partner Institute',
    amount: '₹24,000', milestone: 'Semester 2 Start', transaction_type: 'disbursement',
    timestamp: '2025-02-01 08:45', index: 3,
  }, b2.hash)

  return [b1, b2, b3]
}

const INITIAL_CHAIN = buildInitialChain()

/* ═══════════════════════════════════════════════════════════════════════════
   CHAIN VALIDATION
═══════════════════════════════════════════════════════════════════════════ */

function validateChain(blocks) {
  let isBroken = false;
  return blocks.map((block, i) => {
    // If this specific block was directly tampered with
    if (block.wasTampered) {
      isBroken = true;
      return { ...block, status: 'tampered' }
    }
    
    // If a previous block in the chain was broken, this is orphaned/invalid
    if (isBroken) {
      return { ...block, status: 'invalid' }
    }
    
    // Genesis block is inherently valid if not tampered
    if (i === 0) return { ...block, status: 'valid' }
    
    // Check against predecessor's hash
    const prev = blocks[i - 1]
    if (block.prevHash !== prev.hash) {
      isBroken = true; // The chain breaks here
      return { ...block, status: 'invalid' }
    }
    
    // Default valid state
    return { ...block, status: 'valid' }
  })
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function EntityBadge({ name, size = 28 }) {
  const meta = ENTITIES[name] || { color: 'var(--text-secondary)', bg: 'rgba(122,143,176,0.15)', initials: '??' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{
        width: size, height: size, borderRadius: '7px',
        background: meta.bg, border: `1px solid ${meta.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
        fontSize: `${size * 0.35}px`, color: meta.color,
        flexShrink: 0,
      }}>
        {meta.initials}
      </div>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 800,
        fontSize: '0.78rem', color: 'var(--text-primary)',
      }}>{name}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    valid:    { label: '✓ Valid',    color: 'var(--color-green)', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
    tampered: { label: '⚠ Tampered', color: 'var(--color-gold)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    invalid:  { label: '✗ Broken',   color: 'var(--color-red)', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)' },
  }
  const s = cfg[status] || cfg.valid
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '999px',
      background: s.bg, border: `1px solid ${s.border}`,
      fontFamily: 'Manrope, sans-serif', fontWeight: 800,
      fontSize: '0.68rem', color: s.color, letterSpacing: '0.02em',
    }}>{s.label}</span>
  )
}

function HashField({ label, value, color = 'var(--color-teal)' }) {
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
  const color = broken ? 'var(--color-red)' : 'var(--color-teal)'
  const glow = broken ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.4)'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, [isMobile ? 'height' : 'width']: 0 }}
      animate={{ opacity: 1, scale: 1, [isMobile ? 'height' : 'width']: 48 }}
      exit={{ opacity: 0, scale: 0.8, [isMobile ? 'height' : 'width']: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        width: isMobile ? '100%' : 48,
        height: isMobile ? 48 : 'auto',
        flexShrink: 0,
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: isMobile ? 0 : 70,
      }}
    >
      <motion.div
        animate={broken ? {
          x: isMobile ? 0 : [0, -4, 4, -2, 2, 0],
          y: isMobile ? [0, -4, 4, -2, 2, 0] : 0,
          transition: { duration: 0.4 }
        } : {}}
        style={{
          display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          width: isMobile ? 4 : '100%',
          height: isMobile ? '100%' : 4,
          position: 'relative'
        }}
      >
        {/* The Track */}
        <div style={{
          width: '100%', height: '100%',
          background: broken ? 'rgba(239,68,68,0.2)' : 'rgba(20,184,166,0.2)',
          borderRadius: 2,
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Animated pulse */}
          {!broken && (
            <motion.div
              initial={{ [isMobile ? 'y' : 'x']: '-100%' }}
              animate={{ [isMobile ? 'y' : 'x']: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: isMobile ? '100%' : '50%',
                height: isMobile ? '50%' : '100%',
                background: `linear-gradient(${isMobile ? '180deg' : '90deg'}, transparent, ${color}, transparent)`,
                boxShadow: `0 0 12px ${glow}`,
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            />
          )}
        </div>

        {/* The Arrow Head */}
        <svg
          width={isMobile ? 16 : 14}
          height={isMobile ? 14 : 16}
          viewBox={isMobile ? "0 0 16 14" : "0 0 14 16"}
          style={{
            position: 'absolute',
            [isMobile ? 'bottom' : 'right']: -4,
            filter: `drop-shadow(0 0 6px ${glow})`
          }}
        >
          {isMobile ? (
            <path d="M0 0L8 14L16 0" fill={color} />
          ) : (
            <path d="M0 0L14 8L0 16" fill={color} />
          )}
        </svg>

        {broken && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ position: 'absolute', fontSize: '1.4rem', zIndex: 10 }}
          >💥</motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK CARD
═══════════════════════════════════════════════════════════════════════════ */

function BlockCard({ block, isNew, visiblyInvalid, isSweeping, onTamper }) {
  const isRefund = block.transaction_type === 'refund'
  const effectiveStatus = visiblyInvalid ? (block.status === 'invalid' ? 'invalid' : block.status) : (block.status === 'invalid' ? 'valid' : block.status)

  const borderColor =
    effectiveStatus === 'invalid'  ? 'rgba(239,68,68,0.45)'  :
    effectiveStatus === 'tampered' ? 'rgba(245,158,11,0.45)' :
    isRefund ? 'rgba(245,158,11,0.35)' :
    'rgba(59,140,255,0.18)'

  const headerGlow =
    effectiveStatus === 'invalid'  ? 'rgba(239,68,68,0.07)'  :
    effectiveStatus === 'tampered' ? 'rgba(245,158,11,0.07)' :
    isRefund ? 'rgba(245,158,11,0.05)' :
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
      style={{ width: 238, flexShrink: 0, position: 'relative' }}
    >
      <div style={{
        borderRadius: 13,
        border: `1.5px solid ${borderColor}`,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px)',
        overflow: 'hidden',
        transition: 'border-color 0.4s ease',
        boxShadow: effectiveStatus === 'invalid' ? '0 0 20px rgba(239,68,68,0.1)' :
                   effectiveStatus === 'tampered' ? '0 0 20px rgba(245,158,11,0.1)' :
                   '0 4px 20px rgba(0,0,0,0.25)',
      }}>

        {isSweeping && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              background: 'var(--color-teal)', zIndex: 10, pointerEvents: 'none'
            }}
          />
        )}
                {isSweeping && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              background: 'var(--color-teal)', zIndex: 10, pointerEvents: 'none'
            }}
          />
        )}
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
              background: effectiveStatus === 'invalid' ? 'var(--color-red)' :
                          effectiveStatus === 'tampered' ? 'var(--color-gold)' : (isRefund ? 'var(--color-gold)' : 'var(--color-green)'),
              boxShadow: `0 0 6px ${effectiveStatus === 'invalid' ? '#ef444480' :
                           effectiveStatus === 'tampered' ? '#f59e0b80' : (isRefund ? '#f59e0b80' : '#10b98180')}`,
              transition: 'background 0.4s, box-shadow 0.4s',
            }} />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.68rem', color: 'var(--text-secondary)',
            }}>Block #{block.index}</span>
          </div>
          <StatusBadge status={effectiveStatus} />
        </div>

        {/* Body */}
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* From → To */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <EntityBadge name={block.from} />
            <div style={{ paddingLeft: 8, color: 'var(--text-secondary)', fontSize: '0.7rem' }}>↓</div>
            <EntityBadge name={block.to} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--glass-border)' }} />

          {/* Amount + Milestone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
              fontSize: '1.12rem', color: isRefund ? 'var(--color-gold)' : 'var(--color-green)', letterSpacing: '-0.01em',
            }}>
              {isRefund && <span style={{ fontSize: '0.9rem', marginRight: 4 }}>↩</span>}
              {block.amount}
            </div>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem',
              color: 'var(--color-electric-blue)', fontWeight: 800,
            }}>{isRefund ? block.reason : block.milestone}</div>
            {block.confirmationRef && (
              <div style={{ 
                marginTop: 4, display: 'inline-block',
                background: 'rgba(16,185,129,0.1)', color: 'var(--color-green)',
                padding: '2px 8px', borderRadius: 12,
                fontSize: '0.65rem', fontWeight: 700,
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
                ✓ Institution confirmed {block.confirmationRef}
              </div>
            )}
            {isRefund && block.refundRef && (
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem',
                color: 'var(--color-gold)', fontWeight: 600,
              }}>Ref: {block.refundRef}</div>
            )}
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
              color: 'var(--text-secondary)',
            }}>{block.timestamp}</div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--glass-border)' }} />

          {/* Hashes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <HashField label="prev_hash" value={block.prevHash} color="var(--color-gold)" />
            <HashField label="this_hash" value={block.hash}    color="var(--color-teal)" />
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
              color: 'var(--color-gold)', fontFamily: 'Manrope, sans-serif',
              fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
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
  const isMobile = useIsMobile();
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
        background: 'var(--glass-bg)', backdropFilter: 'blur(8px)',
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
          background: 'var(--glass-bg)',
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
              fontFamily: 'Manrope, sans-serif', fontWeight: 800,
              fontSize: '0.95rem', color: 'var(--color-gold)',
            }}>Tamper with Block #{block.index}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '1.1rem', padding: 4,
            }}
          >✕</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem',
            color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20,
          }}>
            You are about to alter the <strong style={{ color: 'var(--color-gold)' }}>amount</strong> in Block #{block.index}.
            This will change the block's fingerprint — breaking every block after it.
            This demonstrates <strong style={{ color: 'var(--color-electric-blue)' }}>Layer 2 tamper protection</strong>.
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 6,
            }}>Current amount</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem',
              color: 'var(--color-green)', fontWeight: 800,
            }}>{block.amount}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.08em',
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
                color: 'var(--color-gold)', outline: 'none',
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
                color: 'var(--color-red)', fontFamily: 'Manrope, sans-serif',
                fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
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
                color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif',
                fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
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

const EMPTY_FORM = { from: '', to: '', milestone: '', amount: '', refundRef: '' }

const selectStyle = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem',
  background: 'rgba(59,140,255,0.06)',
  border: '1px solid rgba(59,140,255,0.2)',
  borderRadius: 9, padding: '9px 12px',
  color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
  appearance: 'none',
}

function AddBlockSidebar({ blocks, onAdd, addPhase, admissionConfirmations = [] }) {
  const [formMode, setFormMode] = useState('disbursement')
  const [syndication, setSyndication] = useState({ enabled: false, nbfc1: 'NBFC 1', nbfc2: 'NBFC 2', split1: 60, split2: 40, agreedAmount: '' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [shakeKey, setShakeKey] = useState(0)
  const hashPreview = useRef('')

  const usedMilestones = new Set();
  const seenGroups = new Set();
  blocks.forEach(b => {
    if (b.transaction_type === 'refund') return;
    if (b.syndicationGroup) {
      if (!seenGroups.has(b.syndicationGroup)) {
        seenGroups.add(b.syndicationGroup);
        usedMilestones.add(b.milestone);
      }
    } else {
      usedMilestones.add(b.milestone);
    }
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (error) setError(null)
  }

  const handleSubmit = () => {
    const isSyndicated = formMode === 'disbursement' && syndication.enabled;
    if ((!isSyndicated && !form.from) || !form.to || !form.milestone || !form.amount || (formMode === 'refund' && !form.refundRef)) {
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
    
    if (formMode === 'disbursement' && form.milestone === 'Admission Confirmed') {
      const validConfirmation = admissionConfirmations.find(c => c.verified);
      if (!validConfirmation) {
        setError('⚠ No signed Admission Confirmation on file — Institution must sign this first (see Sign & Verify tab).')
        setShakeKey(k => k + 1)
        return
      }
      form.confirmationRef = validConfirmation.signatureHash;
    }

    if (formMode === 'refund') {
      const refIndex = parseInt(form.refundRef.replace(/[^0-9]/g, ''), 10);
      const refBlock = blocks.find(b => b.index === refIndex);
      if (refBlock) {
        const origAmt = parseInt(refBlock.amount.replace(/[^0-9]/g, ''), 10);
        if (amtNum > origAmt) {
          setError(`⚠ Refund amount exceeds original disbursement of ₹${origAmt.toLocaleString('en-IN')} — rejected.`);
          setShakeKey(k => k + 1);
          return;
        }
      }
      onAdd({
        transaction_type: 'refund',
        from: form.from,
        to: form.to,
        reason: form.milestone,
        refundRef: form.refundRef,
        amount: fmtAmount(form.amount),
      });
    } else {
      if (usedMilestones.has(form.milestone)) {
        const dupIdx = blocks.find(b => b.milestone === form.milestone).index
        setError(`⚠ Milestone already disbursed — duplicate tranche rejected. This loan's '${form.milestone}' tranche was already recorded in Block #${dupIdx}.`)
        setShakeKey(k => k + 1)
        return
      }
      if (syndication.enabled) {
        if (syndication.split1 + syndication.split2 !== 100) {
          setError('⚠ Splits must equal exactly 100%.');
          setShakeKey(k => k + 1);
          return;
        }
        const amt1 = Math.round(amtNum * (syndication.split1 / 100));
        const amt2 = amtNum - amt1;
        const groupId = 'SYND-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const b1 = { transaction_type: 'disbursement', from: syndication.nbfc1, to: form.to, milestone: form.milestone, amount: fmtAmount(String(amt1)), syndicationGroup: groupId, splitPercent: syndication.split1 };
        const b2 = { transaction_type: 'disbursement', from: syndication.nbfc2, to: form.to, milestone: form.milestone, amount: fmtAmount(String(amt2)), syndicationGroup: groupId, splitPercent: syndication.split2 };
        if (form.confirmationRef) { b1.confirmationRef = form.confirmationRef; b2.confirmationRef = form.confirmationRef; }
        onAdd([b1, b2]);
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
    }
    setForm(EMPTY_FORM)
    setError(null)
  }

  const isComputing = addPhase === 'computing'
  const isSigning   = addPhase === 'signing'
  const busy        = addPhase !== 'idle'

  const btnLabel =
    isComputing ? '⚙ Computing SHA-256…' :
    isSigning   ? '🔏 Signing with private key…' :
    addPhase === 'done' ? (formMode === 'refund' ? '✓ Refund added!' : '✓ Block added!') :
    (formMode === 'refund' ? '↩ Sign & Add Refund' : '⛓ Sign & Add Block')

  const btnColor =
    isComputing ? '#3b8cff' :
    isSigning   ? '#14b8a6' :
    addPhase === 'done' ? '#10b981' :
    (formMode === 'refund' ? '#f59e0b' : '#3b8cff')

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
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⛓</span> Add New Tranche
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => { setFormMode('disbursement'); setForm(EMPTY_FORM); setError(null); }}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: formMode === 'disbursement' ? 'rgba(59,140,255,0.2)' : 'transparent',
              color: formMode === 'disbursement' ? 'var(--color-electric-blue)' : 'var(--text-secondary)',
              fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.75rem',
            }}
          >Disbursement</button>
          <button
            onClick={() => { setFormMode('refund'); setForm(EMPTY_FORM); setError(null); }}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: formMode === 'refund' ? 'rgba(245,158,11,0.2)' : 'transparent',
              color: formMode === 'refund' ? 'var(--color-gold)' : 'var(--text-secondary)',
              fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.75rem',
            }}
          >Refund</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {/* From */}
          {!(formMode === 'disbursement' && syndication.enabled) && (
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>{formMode === 'refund' ? 'From (Institution)' : 'From (NBFC Node)'}</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.from}
                onChange={e => set('from', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">{formMode === 'refund' ? 'Select institution…' : 'Select NBFC…'}</option>
                {(formMode === 'refund' ? REFUND_FROM_OPTIONS : FROM_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
          )}

          {/* To */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>{formMode === 'refund' ? 'To (NBFC Node)' : 'To (Institution / Platform)'}</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.to}
                onChange={e => set('to', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">{formMode === 'refund' ? 'Select NBFC…' : 'Select recipient…'}</option>
                {(formMode === 'refund' ? REFUND_TO_OPTIONS : TO_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* Milestone */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'block', marginBottom: 5,
            }}>{formMode === 'refund' ? 'Reason' : 'Milestone'}</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.milestone}
                onChange={e => set('milestone', e.target.value)}
                disabled={busy}
                style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
              >
                <option value="">{formMode === 'refund' ? 'Select reason…' : 'Select milestone…'}</option>
                {formMode === 'refund' 
                  ? REFUND_REASONS.map(m => <option key={m} value={m}>{m}</option>)
                  : MILESTONES.map(m => (
                    <option key={m} value={m}>
                      {m}{usedMilestones.has(m) ? ' ✓ disbursed' : ''}
                    </option>
                  ))
                }
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {formMode === 'refund' && (
            <div>
              <label style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
                display: 'block', marginBottom: 5,
              }}>Original Tranche Reference</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.refundRef}
                  onChange={e => set('refundRef', e.target.value)}
                  disabled={busy}
                  style={{ ...selectStyle, opacity: busy ? 0.5 : 1 }}
                >
                  <option value="">Select original block…</option>
                  {blocks.filter(b => (b.transaction_type || 'disbursement') === 'disbursement').map(b => (
                    <option key={b.id} value={`Block #${b.index}`}>
                      Block #{b.index} — {b.amount} ({b.milestone})
                    </option>
                  ))}
                </select>
                <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
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
                background: formMode === 'refund' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
                border: formMode === 'refund' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(16,185,129,0.2)',
                borderRadius: 9, padding: '9px 12px',
                color: formMode === 'refund' ? 'var(--color-gold)' : 'var(--color-green)', outline: 'none',
                opacity: busy ? 0.5 : 1,
              }}
              onFocus={e => { e.target.style.borderColor = formMode === 'refund' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)' }}
              onBlur={e => { e.target.style.borderColor = formMode === 'refund' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }}
              onKeyDown={e => { if (e.key === 'Enter' && !busy) handleSubmit() }}
            />
          </div>

          {/* Hash preview during computing phase */}
          {error && (
            <div style={{ color: 'var(--color-red)', fontSize: '0.75rem', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, lineHeight: 1.4, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <AnimatePresence>
            {isComputing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
                  color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em',
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
                  color: 'var(--color-teal)',
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
                  background: 'var(--badge-red-border)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
                  color: 'var(--color-red)', lineHeight: 1.4,
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
              color: busy ? btnColor : 'var(--bg-body)',
              fontFamily: 'Manrope, sans-serif', fontWeight: 800,
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

      {/* Syndication Panel */}
      <motion.div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Syndicated Loan</span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={syndication.enabled} onChange={e => setSyndication(s => ({ ...s, enabled: e.target.checked }))} style={{ accentColor: 'var(--color-electric-blue)', transform: 'scale(1.2)' }} />
          </label>
        </div>
        
        {syndication.enabled && formMode === 'disbursement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NBFC 1</label>
                <select value={syndication.nbfc1} onChange={e => setSyndication(s => ({ ...s, nbfc1: e.target.value }))} style={selectStyle}>
                  {FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ width: '60px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>%</label>
                <input type="number" value={syndication.split1} onChange={e => setSyndication(s => ({ ...s, split1: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem', background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)', borderRadius: 9, padding: '9px 8px', color: 'var(--text-primary)' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NBFC 2</label>
                <select value={syndication.nbfc2} onChange={e => setSyndication(s => ({ ...s, nbfc2: e.target.value }))} style={selectStyle}>
                  {FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ width: '60px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>%</label>
                <input type="number" value={syndication.split2} onChange={e => setSyndication(s => ({ ...s, split2: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem', background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)', borderRadius: 9, padding: '9px 8px', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Agreed Cap Amount (₹)</label>
              <input type="text" value={syndication.agreedAmount} onChange={e => setSyndication(s => ({ ...s, agreedAmount: e.target.value }))} placeholder="e.g. ₹5,00,000" style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', fontSize: '0.84rem', background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)', borderRadius: 9, padding: '9px 12px', color: 'var(--text-primary)' }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Info card */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
          color: 'var(--color-electric-blue)', textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 7,
        }}>Loan Reference</div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem',
          color: 'var(--color-electric-blue)', marginBottom: 10,
        }}>{LOAN_ID}</div>
        <div style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.74rem',
          color: 'var(--text-secondary)', lineHeight: 1.55,
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

function StatsBar({ blocks, onReset, onRemoveTamper, onVerify, onExport }) {
  const valid   = blocks.filter(b => b.status === 'valid').length
  const broken  = blocks.filter(b => b.status === 'invalid' || b.status === 'tampered').length
  const isClean = broken === 0
  
  const parseAmt = (v) => parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
  const disbursedTotal = blocks.filter(b => (b.transaction_type || 'disbursement') === 'disbursement').reduce((sum, b) => sum + parseAmt(b.amount), 0)
  const refundTotal = blocks.filter(b => b.transaction_type === 'refund').reduce((sum, b) => sum + parseAmt(b.amount), 0)
  const netDisbursed = disbursedTotal - refundTotal

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
          background: isClean ? 'var(--color-green)' : 'var(--color-red)',
          boxShadow: `0 0 8px ${isClean ? '#10b98180' : '#ef444480'}`,
          transition: 'background 0.4s, box-shadow 0.4s',
        }}
      />

      {[
        { label: 'Chain Length', value: `${blocks.length}` },
        { label: 'Valid Blocks', value: `${valid}`, color: 'var(--color-green)' },
        { label: 'Net Disbursed', value: `₹${netDisbursed.toLocaleString('en-IN')}`, color: 'var(--color-gold)' },
        { label: 'Status', value: isClean ? '✓ Verified' : '⚠ Compromised', color: isClean ? 'var(--color-green)' : 'var(--color-red)' },
        { label: 'Verification Time', value: '<12ms', color: 'var(--color-electric-blue)' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--text-secondary)',
          }}>{s.label}:</span>
          <motion.span
            key={s.value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
              fontSize: '0.82rem', color: s.color || 'var(--text-primary)',
            }}
          >{s.value}</motion.span>
        </div>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
        {!isClean && (
          <button
            onClick={onRemoveTamper}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'var(--badge-teal-border)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: 'var(--color-green)', fontFamily: 'Manrope, sans-serif',
              fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.18)'
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--badge-teal-border)'
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            Remove Tamper
          </button>
        )}
        <button
          onClick={onReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(59,140,255,0.1)',
            border: '1px solid rgba(59,140,255,0.25)',
            color: 'var(--color-electric-blue)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
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
        <button
          onClick={onVerify}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            color: 'var(--color-green)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(16,185,129,0.18)'
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Verify Full Chain
        </button>
        <button
          onClick={onExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--text-primary)', fontFamily: 'Manrope, sans-serif',
            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export JSON
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAMPER BANNER
═══════════════════════════════════════════════════════════════════════════ */

function TamperBanner({ info, onDismiss }) {
  if (info.passed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>✓</div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: 'var(--color-green)' }}>
              Integrity Check Passed
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              All block hashes align. The cryptographic chain is completely unbroken and mathematically secure.
            </div>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>✕</button>
      </motion.div>
    )
  }
  if (info.failed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>✗</div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: 'var(--color-red)' }}>
              Integrity Check Failed
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              The verification sweep detected tampered blocks or orphaned connections. The chain is compromised.
            </div>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>✕</button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', borderRadius: 10,
        background: 'var(--badge-red-border)',
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
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: '0.84rem', color: 'var(--color-red)',
        }}>
          Tamper detected — chain integrity broken from Tranche #{info.fromTranche} onward.
          {' '}
          <span style={{ fontWeight: 800, color: 'var(--badge-red-border)' }}>
            The ledger fingerprint chain has been compromised.
          </span>
        </span>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', color: 'var(--badge-red-border)',
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

export default function LedgerTab({ blocks, setBlocks, admissionConfirmations = [] }) {
  const [visibleInvalid, setVisibleInvalid] = useState(new Set())
  const [sweepProgress, setSweepProgress] = useState(-1)
  const sweepInterval = useRef(null)

  const handleVerifySweep = () => {
    setSweepProgress(0)
    if (sweepInterval.current) clearInterval(sweepInterval.current)
    let p = 0
    sweepInterval.current = setInterval(() => {
      p++
      if (p >= blocks.length + 1) {
        clearInterval(sweepInterval.current)
        setTimeout(() => {
          setSweepProgress(-1)
          const isBroken = blocks.some((b, i) => b.status === 'invalid' || b.status === 'tampered' || visibleInvalid.has(i))
          setBannerInfo(isBroken ? { failed: true } : { passed: true })
        }, 800)
      } else {
        setSweepProgress(p)
      }
    }, 150)
  }

  const handleExportJson = () => {
    const exportData = blocks.map(b => ({
      id: b.id,
      index: b.index,
      from: b.from,
      to: b.to,
      amount: b.amount,
      milestone: b.milestone,
      timestamp: b.timestamp,
      prevHash: b.prevHash,
      hash: b.hash,
      wasTampered: b.wasTampered,
      status: b.status
    }))
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tranchechain-ledger-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const [tamperModal, setTamperModal] = useState(null)
  const [addPhase, setAddPhase] = useState('idle')
  const [bannerInfo, setBannerInfo] = useState(null)
  const [newestId, setNewestId] = useState(null)
  const isMobile = useIsMobile();
  const chainRef = useRef(null)
  const addTimers = useRef([])

  // Window resize listener
  useEffect(() => {
    
    
    
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
  const handleRemoveTamper = useCallback(() => {
    setBlocks(prev => {
      const restored = prev.map(b => 
        b.wasTampered ? { ...b, amount: b.originalAmount, wasTampered: false } : { ...b }
      );
      for (let i = 0; i < restored.length; i++) {
        if (i > 0) restored[i].prevHash = restored[i - 1].hash;
        restored[i].hash = computeHash(restored[i]);
      }
      return validateChain(restored);
    });
    setVisibleInvalid(new Set());
    setBannerInfo(null);
  }, []);

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
          <StatsBar blocks={blocks} onReset={handleReset} onRemoveTamper={handleRemoveTamper} onVerify={handleVerifySweep} onExport={handleExportJson} />
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
              <AnimatePresence>
                {blocks.map((block, i) => (
                  <div key={block.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start' }}>
                    <BlockCard
                      block={block}
                      isNew={block.id === newestId}
                      visiblyInvalid={visibleInvalid.has(i)}
                      isSweeping={sweepProgress === i + 1}
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
                      background: 'var(--glass-bg)',
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
              color: 'var(--text-secondary)', textAlign: 'center',
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
            admissionConfirmations={admissionConfirmations}
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
