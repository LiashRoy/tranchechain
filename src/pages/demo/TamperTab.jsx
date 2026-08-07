import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoJS from 'crypto-js'

/* ═══════════════════════════════════════════════════════════════════════════
   CRYPTO UTILITIES
═══════════════════════════════════════════════════════════════════════════ */

const sha256 = (str) => CryptoJS.SHA256(str).toString()
const GENESIS_PREV = '0'.repeat(64)

const blockStr = ({ from, to, amount, milestone, timestamp, prevHash }) =>
  `EDU-2024-001||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`

const computeHash = (b) => sha256(blockStr(b))

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION PHASES
═══════════════════════════════════════════════════════════════════════════ */

// 'idle' | 'targeting' | 'glitching' | 'hashing' | 'propagating' | 'complete'

const GLITCH_FRAMES = [
  '₹24,000',
  '₹51,247', '₹8,091', '₹87,634',
  '₹42,108', '₹63,015', '₹29,744',
  '₹91,382', '₹56,000', '₹75,000',
]

const PHASE_LABELS = [
  { id: 'targeting',   num: '①', label: 'Block 2 targeted' },
  { id: 'glitching',  num: '②', label: 'Amount altered' },
  { id: 'hashing',    num: '③', label: 'Hash recomputed' },
  { id: 'propagating',num: '④', label: 'Chain breaking…' },
  { id: 'complete',   num: '⑤', label: 'Tampering detected' },
]

/* ═══════════════════════════════════════════════════════════════════════════
   ENTITY METADATA
═══════════════════════════════════════════════════════════════════════════ */

const ENTITY_META = {
  'NBFC 1':        { color: 'var(--color-electric-blue)', initials: 'N1' },
  'NBFC 2':        { color: 'var(--color-teal)', initials: 'N2' },
  'NBFC 3':     { color: 'var(--color-electric-blue)', initials: 'N3' },
  'Fintech Company': { color: 'var(--color-gold)', initials: 'GQ' },
  'Partner Institute':    { color: 'var(--color-green)', initials: 'PI' },
}

function EntityPill({ name }) {
  const m = ENTITY_META[name] || { color: 'var(--text-secondary)', initials: '??' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: `${m.color}20`, border: `1.5px solid ${m.color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
        fontSize: '0.85rem', color: m.color,
        flexShrink: 0,
      }}>{m.initials}</div>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 800,
        fontSize: '1.02rem', color: 'var(--text-primary)',
      }}>{name}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HASH DISPLAY — supports strikethrough + typing animation
═══════════════════════════════════════════════════════════════════════════ */

function HashLine({ label, value, color, strikethrough = false, typingValue = null, tamperedHash = null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
        color, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{label}</span>

      <div style={{ position: 'relative', minHeight: 20 }}>
        {/* Original hash — can strike through */}
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem',
          color: strikethrough ? `${color}40` : color,
          textDecoration: strikethrough ? 'line-through' : 'none',
          wordBreak: 'break-all', lineHeight: 1.4,
          transition: 'color 0.3s, text-decoration 0.3s',
          opacity: strikethrough && typingValue ? 0.35 : 1,
        }}>
          {value.slice(0, 16)}…
        </div>

        {/* New hash typing in */}
        <AnimatePresence>
          {typingValue !== null && typingValue.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem',
                color: 'var(--color-red)', wordBreak: 'break-all', lineHeight: 1.4,
                marginTop: 4,
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 4, padding: '2px 6px',
              }}
            >
              {typingValue.slice(0, 16)}
              {typingValue.length < (tamperedHash ? tamperedHash.length : 64) && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.45, repeat: Infinity }}
                  style={{ borderRight: '2px solid #ef4444', marginLeft: 1 }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO BLOCK CARD
═══════════════════════════════════════════════════════════════════════════ */

function DemoBlock({
  block,
  isTargeted,     // gold highlight ring
  originalAmount,
  tamperedAmount,
  tamperedHash,
  displayAmount,  // override amount (glitch frames)
  hashStruck,     // bool — old hash struck through
  typingHash,     // string | null — new hash being typed
  status,         // 'valid' | 'tampered' | 'invalid'
  isShaking,
}) {
  const borderColor =
    status === 'invalid'  ? 'rgba(239,68,68,0.7)'  :
    status === 'tampered' ? 'rgba(245,158,11,0.7)' :
    isTargeted            ? 'rgba(245,158,11,0.6)' :
    'rgba(59,140,255,0.22)'

  const glowColor =
    status === 'invalid'  ? '0 0 36px rgba(239,68,68,0.25)'  :
    status === 'tampered' ? '0 0 36px rgba(245,158,11,0.3)'  :
    isTargeted            ? '0 0 36px rgba(245,158,11,0.2)'  :
    '0 4px 24px rgba(0,0,0,0.3)'

  const headerBg =
    status === 'invalid'  ? 'rgba(239,68,68,0.09)'  :
    status === 'tampered' ? 'rgba(245,158,11,0.09)' :
    isTargeted            ? 'rgba(245,158,11,0.07)' :
    'rgba(59,140,255,0.05)'

  const statusIcon =
    status === 'invalid'  ? '✗' :
    status === 'tampered' ? '⚠' :
    '✓'

  const statusColor =
    status === 'invalid'  ? 'var(--color-red)' :
    status === 'tampered' ? 'var(--color-gold)' :
    'var(--color-green)'

  return (
    <motion.div
      animate={
        isShaking
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45 } }
          : { x: 0 }
      }
      style={{ width: 250, flexShrink: 0 }}
    >
      {/* Outer glow ring for targeted */}
      <AnimatePresence>
        {isTargeted && status === 'valid' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.7, 0.4], scale: [0.95, 1.02, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: -4, borderRadius: 18,
              border: '2px solid rgba(245,158,11,0.6)',
              boxShadow: '0 0 40px rgba(245,158,11,0.3)',
              pointerEvents: 'none', zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        style={{ position: 'relative', zIndex: 2 }}
        animate={{
          borderColor,
          boxShadow: glowColor,
        }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          borderRadius: 14,
          border: `2px solid ${borderColor}`,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(14px)',
          overflow: 'hidden',
          transition: 'border-color 0.4s, box-shadow 0.4s',
          boxShadow: glowColor,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1.5px solid ${borderColor}`,
            background: headerBg,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background 0.4s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.div
                animate={{ background: statusColor }}
                transition={{ duration: 0.4 }}
                style={{
                  width: 9, height: 9, borderRadius: '50%',
                  boxShadow: `0 0 8px ${statusColor}80`,
                }}
              />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                fontSize: '0.98rem', color: 'var(--text-secondary)',
              }}>Block #{block.index}</span>
            </div>
            <motion.span
              animate={{ color: statusColor }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                fontSize: '0.94rem',
              }}
            >
              {statusIcon} {status === 'valid' ? 'Valid' : status === 'tampered' ? 'Tampered' : 'Broken'}
            </motion.span>
          </div>

          {/* Body */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* From → To */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <EntityPill name={block.from} />
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.90rem',
                color: 'var(--text-secondary)', paddingLeft: 8,
              }}>↓ disburses to</div>
              <EntityPill name={block.to} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${borderColor}40` }} />

            {/* Milestone + Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                color: 'var(--color-electric-blue)', fontWeight: 800,
              }}>{block.milestone}</div>

              {/* AMOUNT — animated glitch target */}
              <motion.div
                key={displayAmount}
                animate={
                  displayAmount !== originalAmount && displayAmount !== tamperedAmount
                    ? { opacity: [0.5, 1], y: [-2, 0] }
                    : {}
                }
                transition={{ duration: 0.05 }}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 800,
                  fontSize: '1.88rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  color:
                    displayAmount === tamperedAmount ? 'var(--color-red)' :
                    displayAmount !== originalAmount ? 'var(--color-gold)' :
                    'var(--color-green)',
                  transition: 'color 0.3s',
                }}
              >
                {displayAmount}
              </motion.div>

              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}>{block.timestamp}</div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${borderColor}40` }} />

            {/* Hashes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <HashLine
                label="prev_hash"
                value={block.prevHash}
                color="var(--color-gold)"
              />
              <HashLine
                label="this_hash"
                value={block.hash}
                color={status === 'tampered' || hashStruck ? 'var(--color-teal)' : 'var(--color-teal)'}
                strikethrough={hashStruck}
                typingValue={typingHash}
                tamperedHash={tamperedHash}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAIN CONNECTOR
═══════════════════════════════════════════════════════════════════════════ */

function DemoConnector({ broken, shockwavePassing }) {
  return (
    <div style={{
      width: 56, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      paddingTop: 68, gap: 4,
      position: 'relative', overflow: 'visible',
    }}>
      {/* Main line */}
      <motion.div
        animate={{
          background: broken
            ? 'rgba(239,68,68,0.55)'
            : shockwavePassing
            ? 'rgba(245,158,11,0.8)'
            : 'linear-gradient(90deg, rgba(20,184,166,0.5), rgba(59,140,255,0.5))',
          height: broken ? 3 : 2,
        }}
        transition={{ duration: 0.35 }}
        style={{ width: '100%', borderRadius: 2 }}
      />

      {/* Arrow */}
      <svg
        style={{ position: 'absolute', right: -2, top: '50%', transform: 'translateY(-4px)' }}
        width="10" height="12" viewBox="0 0 10 12"
      >
        <path
          d="M0 0L10 6L0 12"
          fill="none"
          stroke={broken ? 'rgba(239,68,68,0.55)' : 'rgba(20,184,166,0.5)'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Shockwave pulse dot */}
      <AnimatePresence>
        {shockwavePassing && (
          <motion.div
            key="pulse"
            initial={{ x: -30, opacity: 0, scale: 0.5 }}
            animate={{ x: 30, opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '50%',
              transform: 'translateY(-50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: 'radial-gradient(circle, #ef4444, #f59e0b)',
              boxShadow: '0 0 20px rgba(239,68,68,0.8)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Crack icon */}
      <AnimatePresence>
        {broken && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              fontSize: '1.25rem', lineHeight: 1, marginTop: 4,
              filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.6))',
            }}
          >💥</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PHASE INDICATOR (step-by-step progress)
═══════════════════════════════════════════════════════════════════════════ */

function PhaseIndicator({ currentPhase }) {
  const currentIdx = PHASE_LABELS.findIndex(p => p.id === currentPhase)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      flexWrap: 'wrap', justifyContent: 'center',
    }}>
      {PHASE_LABELS.map((p, i) => {
        const isActive = p.id === currentPhase
        const isDone   = i < currentIdx
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <motion.div
              animate={{
                background: isActive ? 'rgba(59,140,255,0.2)' : isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: isActive ? 'rgba(59,140,255,0.6)' : isDone ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)',
              }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 999,
                border: '1px solid',
              }}
            >
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.90rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--color-electric-blue)' : isDone ? 'var(--color-green)' : 'var(--text-secondary)',
              }}>
                {isDone ? '✓' : p.num} {p.label}
              </span>
            </motion.div>
            {i < PHASE_LABELS.length - 1 && (
              <div style={{ width: 8, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BIG RED BANNER
═══════════════════════════════════════════════════════════════════════════ */

function TamperBanner() {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{
        padding: '20px 32px',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.10))',
        border: '2px solid rgba(239,68,68,0.55)',
        borderRadius: 14,
        boxShadow: '0 0 60px rgba(239,68,68,0.2), inset 0 0 40px rgba(239,68,68,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ fontSize: '2.50rem', lineHeight: 1 }}
        >
          🚨
        </motion.div>
        <div>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
            color: 'var(--color-red)', letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            TAMPERING DETECTED
          </div>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 800,
            fontSize: '1.13rem', color: 'rgba(248,113,113,0.75)',
          }}>
            Chain broken at Tranche 2 · 3 blocks compromised
          </div>
        </div>
      </div>

      {/* Severity chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Signature Mismatch', 'Hash Chain Broken', 'prev_hash Invalid'].map(label => (
          <span key={label} style={{
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.35)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
            color: 'var(--color-red)',
          }}>{label}</span>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY NOTE
═══════════════════════════════════════════════════════════════════════════ */

function SecurityNote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{
        padding: '20px 28px',
        background: 'rgba(59,140,255,0.05)',
        border: '1px solid rgba(59,140,255,0.15)',
        borderRadius: 12,
      }}
    >
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 800,
        fontSize: '1.06rem', color: 'var(--color-electric-blue)', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>🛡️</span> Why this fraud can't be hidden — Two-Layer Protection
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 14,
      }}>
        {[
          {
            layer: 'Layer 1',
            color: 'var(--color-teal)',
            icon: '🔏',
            title: 'Digital Signature (Wax Seal)',
            text: 'The attacker would also need to forge NBFC 2\'s ECDSA private key to produce a valid signature over the manipulated amount. Without the private key, this is computationally infeasible — the trapdoor function cannot be reversed.',
          },
          {
            layer: 'Layer 2',
            color: 'var(--color-electric-blue)',
            icon: '⛓',
            title: 'Hash Chain (Fingerprint of Fingerprints)',
            text: 'Even with a forged signature, the attacker must recompute proof-of-work for every subsequent block faster than the entire honest network — a race they cannot win as long as honest nodes hold >50% of hash power.',
          },
        ].map(item => (
          <div key={item.layer} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: `${item.color}15`, border: `1px solid ${item.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', flexShrink: 0,
            }}>{item.icon}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 999,
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}25`,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem',
                  color: item.color,
                }}>{item.layer}</span>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                  fontSize: '1.00rem', color: 'var(--text-primary)',
                }}>{item.title}</span>
              </div>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '1.00rem',
                color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0,
              }}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function TamperTab({ blocks, setBlocks }) {
  // Animation state
  const [phase, setPhase] = useState('idle')
  const [glitchFrame, setGlitchFrame] = useState(0)   // index into GLITCH_FRAMES
  const [hashStruck, setHashStruck] = useState(false)
  const [typingHash, setTypingHash] = useState(null)   // null | string (growing)
  const [connectorBroken, setConnectorBroken] = useState(Array(Math.max(3, blocks.length)).fill(false)) // connectors 1-2, 2-3, 3-4
  const [blockStatus, setBlockStatus] = useState(Array(Math.max(4, blocks.length)).fill('valid'))
  const [shockwaveConnector, setShockwaveConnector] = useState(-1) // which connector is pulsing
  const [shakingBlock, setShakingBlock] = useState(-1)

  const timers = useRef([])

  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const after = (ms, fn) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
    return t
  }

  /* ── RESET ──────────────────────────────────────────────────────── */
  const reset = useCallback(() => {
    clearAllTimers()
    setPhase('idle')
    setGlitchFrame(0)
    setHashStruck(false)
    setTypingHash(null)
    setConnectorBroken([false, false, false])
    setBlockStatus(['valid', 'valid', 'valid', 'valid'])
    setShockwaveConnector(-1)
    setShakingBlock(-1)
  }, [])

  useEffect(() => () => clearAllTimers(), [])

  /* ── SEQUENCE ───────────────────────────────────────────────────── */
  const startSequence = useCallback(() => {
    if (phase !== 'idle') return
    clearAllTimers()

    // ① TARGETING — highlight Block 2
    setPhase('targeting')

    // ② GLITCHING — amount ticks through frames
    after(700, () => {
      setPhase('glitching')
      GLITCH_FRAMES.forEach((_, i) => {
        after(700 + i * 90, () => setGlitchFrame(i))
      })
    })

    // ② → ③ Settled on tampered amount
    after(700 + GLITCH_FRAMES.length * 90 + 100, () => {
      setPhase('hashing')
      setBlockStatus(s => { const n = [...s]; n[1] = 'tampered'; return n })

      // Strikethrough old hash
      after(700 + GLITCH_FRAMES.length * 90 + 300, () => {
        setHashStruck(true)
      })

      // Start typing new hash char by char
      after(700 + GLITCH_FRAMES.length * 90 + 600, () => {
        let charIdx = 0
        const typeInterval = setInterval(() => {
          charIdx++
          setTypingHash(TAMPERED_B2_HASH.slice(0, charIdx))
          if (charIdx >= TAMPERED_B2_HASH.length) {
            clearInterval(typeInterval)
          }
        }, 22)
        timers.current.push(typeInterval)
      })
    })

    // ④ PROPAGATING — shockwave + cascade invalidation
    // All inner after() calls use RELATIVE delays from now=0, since after() sets absolute timers
    const propagateStart = 700 + GLITCH_FRAMES.length * 90 + 600 + TAMPERED_B2_HASH.length * 22 + 300

    after(propagateStart, () => {
      setPhase('propagating')
      setShockwaveConnector(1)   // connector between block 2 and 3 starts glowing
    })

    after(propagateStart + 300, () => {
      setConnectorBroken(s => { const n = [...s]; n[1] = true; return n })
      setShockwaveConnector(2)   // shockwave moves to connector between block 3 and 4
      setBlockStatus(s => { const n = [...s]; n[2] = 'invalid'; return n })
      setShakingBlock(2)
    })

    after(propagateStart + 500, () => {
      setShakingBlock(-1)
    })

    after(propagateStart + 520, () => {
      setConnectorBroken(s => { const n = [...s]; n[2] = true; return n })
      setBlockStatus(s => { const n = [...s]; n[3] = 'invalid'; return n })
      setShockwaveConnector(-1)
      setShakingBlock(3)
    })

    after(propagateStart + 720, () => {
      setShakingBlock(-1)
    })

    // ⑤ COMPLETE — banner
    after(propagateStart + 900, () => {
      setPhase('complete')
    })
  }, [phase])

  // Dynamic references based on passed blocks
  const targetBlockIndex = 1; // We always tamper with the 2nd block (index 1) for the demo, if it exists
  const targetBlock = blocks[targetBlockIndex] || blocks[0] || {};
  const ORIGINAL_AMOUNT = targetBlock.amount || '₹24,000';
  const TAMPERED_AMOUNT = '₹75,000';
  const TAMPERED_B2_HASH = computeHash({...targetBlock, amount: TAMPERED_AMOUNT});
  
  const displayAmount = GLITCH_FRAMES[glitchFrame] || ORIGINAL_AMOUNT;

  const isComplete = phase === 'complete'
  const isIdle     = phase === 'idle'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', width: '100%' }}>

        {/* ── PAGE HEADER ──────────────────────────────────────────── */}
        

        {/* ── TAMPER BANNER ────────────────────────────────────────── */}
        <AnimatePresence>
          {isComplete && (
            <div style={{ marginBottom: 24 }}>
              <TamperBanner />
            </div>
          )}
        </AnimatePresence>

        {/* ── PHASE INDICATOR ─────────────────────────────────────── */}
        <AnimatePresence>
          {!isIdle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginBottom: 28 }}
            >
              <PhaseIndicator currentPhase={phase} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CHAIN ───────────────────────────────────────────────── */}
        <div style={{ overflowX: 'auto', paddingBottom: 16, marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            gap: 0, minWidth: 'max-content',
            padding: '8px 0',
          }}>
            {blocks.map((block, i) => (
              <div key={block.index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <DemoBlock
                  block={block}
                  isTargeted={phase === 'targeting' && i === 1}
                  displayAmount={i === 1 ? displayAmount : block.amount}
                  hashStruck={i === 1 && hashStruck}
                  typingHash={i === 1 ? typingHash : null}
                  status={blockStatus[i]}
                  isShaking={shakingBlock === i}
                  originalAmount={ORIGINAL_AMOUNT}
                  tamperedAmount={TAMPERED_AMOUNT}
                  tamperedHash={TAMPERED_B2_HASH}
                />
                {i < blocks.length - 1 && (
                  <DemoConnector
                    broken={connectorBroken[i]}
                    shockwavePassing={shockwaveConnector === i}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA BUTTON AREA ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 16, marginBottom: 40, flexWrap: 'wrap',
        }}>
          <AnimatePresence mode="wait">
            {isIdle ? (
              <motion.button
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                onClick={startSequence}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '18px 44px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff', fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800, fontSize: '1.38rem', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(239,68,68,0.35)',
                  letterSpacing: '-0.01em',
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>🔨</span>
                Attempt Tampering
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </motion.button>
            ) : isComplete ? (
              <motion.div
                key="complete-btns"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
              >
                <button
                  onClick={reset}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '14px 32px', borderRadius: 12,
                    background: 'rgba(59,140,255,0.1)',
                    border: '1.5px solid rgba(59,140,255,0.35)',
                    color: 'var(--color-electric-blue)', fontFamily: 'Manrope, sans-serif',
                    fontWeight: 800, fontSize: '1.19rem', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,140,255,0.18)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,140,255,0.1)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Restore Chain &amp; Replay
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 32px', borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--color-red)',
                    boxShadow: '0 0 10px rgba(239,68,68,0.7)',
                  }}
                />
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                  fontSize: '1.13rem', color: 'var(--color-red)',
                }}>Tampering sequence running…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SECURITY NOTE (appears after complete) ───────────────── */}
        <AnimatePresence>
          {isComplete && (
            <SecurityNote />
          )}
        </AnimatePresence>

        {/* ── IDLE EXPLAINER ──────────────────────────────────────── */}
        <AnimatePresence>
          {isIdle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '20px 24px',
                background: 'rgba(59,140,255,0.04)',
                border: '1px solid rgba(59,140,255,0.1)',
                borderRadius: 12,
                fontFamily: 'Manrope, sans-serif', fontSize: '1.06rem',
                color: 'var(--text-secondary)', lineHeight: 1.65, textAlign: 'center',
              }}
            >
              🎬 <strong style={{ color: 'var(--text-secondary)' }}>Presentation mode:</strong> press the button above to run the full animated tamper sequence automatically.
              No manual input needed — designed to be demonstrated live on a projected screen.
              The sequence takes ~5 seconds and ends in a fully broken chain state.
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
