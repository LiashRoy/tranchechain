import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { motion, useInView, useAnimation, animate } from 'framer-motion'
import PhoneFrame from '../components/PhoneFrame'
import { FolderSync, ShieldAlert, Clock, Landmark, Link as LinkIcon, Building2, User, BookOpen, GraduationCap, CheckCircle2, ShieldCheck, Database, AlertTriangle, FileText } from 'lucide-react'



/* ─── MINI PREVIEW BLOCKS FOR PHONE ──────────────────────────────────────────── */
function MiniPreviewBlock({ amount, from, milestone }) {
  return (
    <div style={{
      padding: '8px 10px', marginBottom: '8px', borderRadius: '8px',
      background: 'rgba(20,184,166,0.08)',
      border: '1px solid rgba(20,184,166,0.2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.55rem', color: '#14b8a6', fontWeight: 600 }}>{milestone}</span>
        <CheckCircle2 size={12} color="#10b981" />
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>{amount}</div>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.5rem', color: '#7a8fb0' }}>{from} → PI</div>
    </div>
  )
}

/* ─── 2. PROBLEM CARDS ──────────────────────────────────────────────────────── */
const PROBLEMS = [
  {
    icon: <FolderSync size={24} color="#3b82f6" />,
    color: '#3b82f6',
    title: 'The Trust Gap',
    desc: 'NBFC, Fintech Company-style platform, and institution each maintain separate records of the same tranche. No single source of truth — reconciliation happens by email.',
    tag: 'Siloed Ledgers',
  },
  {
    icon: <ShieldAlert size={24} color="#3b82f6" />,
    color: '#3b82f6',
    title: 'The Double-Disbursement Risk',
    desc: 'Without a tamper-evident ledger, the same tranche can be marked "paid" twice — once by the NBFC system, once by the platform — before anyone notices.',
    tag: 'Integrity Risk',
  },
  {
    icon: <Clock size={24} color="#3b82f6" />,
    color: '#3b82f6',
    title: 'The Backdating Risk',
    desc: 'Records stored in mutable databases can be silently altered after the fact. No hash chain = no proof that a tranche was disbursed on a specific date.',
    tag: 'Audit Trail Gap',
  },
]

function ProblemCard({ card, i }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="glass-card"
      style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'default', willChange: 'opacity, transform' }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '13px',
        background: `${card.color}12`,
        border: `1px solid ${card.color}28`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
      }}>
        {card.icon}
      </div>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}>
          <h3 style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#d4e0ef',
            margin: 0,
          }}>{card.title}</h3>
          <span style={{
            padding: '2px 9px',
            borderRadius: '999px',
            background: `${card.color}12`,
            border: `1px solid ${card.color}25`,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.64rem',
            color: card.color,
          }}>{card.tag}</span>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.87rem',
          color: '#7a8fb0',
          lineHeight: 1.65,
          margin: 0,
        }}>{card.desc}</p>
      </div>
    </motion.div>
  )
}

/* ─── 3. FLOW DIAGRAM ───────────────────────────────────────────────────────── */
const FLOW_NODES = [
  { id: 'nbfc',     label: 'NBFC',              sub: 'NBFC 1 · NBFC 2',   icon: <Landmark size={28} color="#3b82f6" />, color: '#3b82f6' },
  { id: 'platform', label: 'Fintech Company', sub: 'Education Finance Node',      icon: <LinkIcon size={28} color="#3b82f6" />, color: '#3b82f6' },
  { id: 'inst',     label: 'Institution',        sub: 'Full Ledger Copy',            icon: <Building2 size={28} color="#3b82f6" />, color: '#3b82f6' },
  { id: 'student',  label: 'Student / Parent',   sub: 'Wallet — no node required',  icon: <User size={28} color="#94a3b8" />, color: '#94a3b8' },
]


const TRAD_NODES = [
  { id: 'nbfc', label: 'NBFC', sub: 'Siloed Database', icon: <Database size={28} color="#ef4444" />, color: '#ef4444' },
  { id: 'platform', label: 'Fintech Company', sub: 'Spreadsheet / DB', icon: <FileText size={28} color="#f59e0b" />, color: '#f59e0b' },
  { id: 'inst', label: 'Institution', sub: 'Manual Entry', icon: <Building2 size={28} color="#ef4444" />, color: '#ef4444' },
  { id: 'student', label: 'Student / Parent', sub: 'Manual App Check', icon: <User size={28} color="#94a3b8" />, color: '#94a3b8' },
]

function TraditionalFlowDiagram() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref} style={{ overflowX: 'auto', paddingBottom: '8px', opacity: 0.85, marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: '640px', position: 'relative' }}>
        {TRAD_NODES.map((node, i) => (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Node box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.18, duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '16px', background: `${node.color}14`,
                border: `1.5px dashed ${node.color}50`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.7rem',
              }}>
                {node.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#9badc8', marginBottom: '3px' }}>{node.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: node.color, opacity: 0.75 }}>{node.sub}</div>
              </div>
            </motion.div>

            {/* Arrow connector */}
            {i < TRAD_NODES.length - 1 && (
              <div style={{ position: 'relative', width: '56px', flexShrink: 0, height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Static line */}
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1.5px', borderBottom: '1.5px dashed rgba(239,68,68,0.3)', transform: 'translateY(-50%)' }} />
                
                {/* Label */}
                <div style={{ position: 'absolute', top: -20, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#ef4444', opacity: 0.8, whiteSpace: 'nowrap' }}>
                  {i === 0 ? 'Email/API' : i === 1 ? 'Manual Sync' : 'Wait for Updates'}
                </div>
                
                {/* Error Pulse */}
                {i === 1 && inView && (
                  <motion.div
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}
                  >
                    <div style={{ background: 'rgba(239,68,68,0.15)', padding: '4px', borderRadius: '50%' }}>
                      <AlertTriangle size={16} fill="rgba(239,68,68,0.3)" />
                    </div>
                    <div style={{ position: 'absolute', top: 26, width: '130px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.55rem', color: '#ef4444', fontWeight: 700, lineHeight: 1.2, background: 'rgba(20,20,20,0.95)', padding: '4px 6px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 4px 12px rgba(239,68,68,0.15)' }}>
                      ⚠ Double-Disbursement Risk
                    </div>
                  </motion.div>
                )}
                <svg style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 3-6 3" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function FlowDiagram() {

  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div
      ref={ref}
      style={{
        overflowX: 'auto',
        paddingBottom: '8px',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        minWidth: '640px',
        position: 'relative',
      }}>
        {FLOW_NODES.map((node, i) => (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Node box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              whileHover={{ scale: 1.05 }}
              transition={{ delay: i * 0.18, duration: 0.4 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: 'default',
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: `${node.color}14`,
                border: `1.5px solid ${node.color}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                boxShadow: `0 0 18px ${node.color}18`,
              }}>
                {node.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#d4e0ef',
                  marginBottom: '3px',
                }}>{node.label}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  color: node.color,
                  opacity: 0.75,
                }}>{node.sub}</div>
              </div>
            </motion.div>

            {/* Arrow connector */}
            {i < FLOW_NODES.length - 1 && (
              <div style={{
                position: 'relative',
                width: '56px',
                flexShrink: 0,
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Static line */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(59,140,255,0.2), rgba(20,184,166,0.2))',
                  transform: 'translateY(-50%)',
                }} />

                {/* Travelling pulse dot */}
                {inView && (
                  <motion.div
                    animate={{ x: [-4, 52, -4] }}
                    transition={{
                      duration: 2.2,
                      delay: i * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      transform: 'translateY(-50%)',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b8cff, #14b8a6)',
                      boxShadow: '0 0 8px rgba(59,140,255,0.7)',
                    }}
                  />
                )}

                {/* Arrow head */}
                <svg
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                  width="8" height="8" viewBox="0 0 8 8" fill="none"
                >
                  <path d="M1 1l6 3-6 3" stroke="rgba(59,140,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.85 }}
        style={{
          display: 'flex',
          gap: '20px',
          marginTop: '28px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { color: '#3b8cff', label: 'Full node — holds complete ledger copy' },
          { color: '#9badc8', label: 'Transactor — wallet only, no node required' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: item.color,
              opacity: 0.7,
            }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.78rem',
              color: '#7a8fb0',
            }}>{item.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* ─── 4. ANIMATED COUNTER ────────────────────────────────────────────────────── */
function AnimatedCounter({ to, suffix = '', prefix = '', duration = 1.6 }) {
  const ref = useRef(null)
  const nodeRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: v => setDisplay(Math.round(v)),
    })
    return controls.stop
  }, [inView, to, duration])

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  )
}

const STATS = [
  { label: 'Tranche Blocks Tracked',   value: 4,   suffix: '',   prefix: '',  color: '#3b8cff' },
  { label: 'Tamper Detection Rate',    value: 100, suffix: '%',  prefix: '',  color: '#14b8a6' },
  { label: 'Disputes Recorded',        value: 0,   suffix: '',   prefix: '',  color: '#10b981' },
  { label: 'Avg. Verification Time',   value: 12,  suffix: 'ms', prefix: '<', color: '#a78bfa' },
]

/* ─── STAT CARD (hooks at component level, not inside .map) ─────────────────── */
function StatCard({ stat, i }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.1, duration: 0.45 }}
      whileHover={{ scale: 1.03, boxShadow: `0 8px 32px ${stat.color}15` }}
      className="glass-card"
      style={{
        padding: '28px 20px',
        textAlign: 'center',
        borderColor: `${stat.color}20`,
        cursor: 'default',
      }}
    >
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700,
        fontSize: 'clamp(2rem, 4vw, 2.8rem)',
        color: stat.color,
        letterSpacing: '-0.02em',
        marginBottom: '8px',
        lineHeight: 1,
      }}>
        <AnimatedCounter
          to={stat.value}
          suffix={stat.suffix}
          prefix={stat.prefix}
          duration={1.4 + i * 0.15}
        />
      </div>
      <div style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.82rem',
        color: '#7a8fb0',
        fontWeight: 500,
      }}>{stat.label}</div>
    </motion.div>
  )
}

/* ─── SECTION WRAPPER with scroll fade+slide ────────────────────────────────── */
function ScrollSection({ children, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-70px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

/* ─── SECTION HEADING ────────────────────────────────────────────────────────── */
function SectionHeading({ eyebrow, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
      {eyebrow && (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#3b8cff',
          opacity: 0.8,
          marginBottom: '12px',
        }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
        letterSpacing: '-0.025em',
        color: '#d4e0ef',
        margin: '0 0 12px',
      }}>{title}</h2>
      {sub && (
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.95rem',
          color: '#7a8fb0',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: 1.65,
        }}>{sub}</p>
      )}
    </div>
  )
}

/* ─── HEADLINE WORD ANIMATION ────────────────────────────────────────────────── */
const HEADLINE_WORDS = ['Every', 'Rupee.', 'Every', 'Handoff.', 'Provable.']

function AnimatedHeadline() {
  return (
    <h1 style={{
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 800,
      fontSize: 'clamp(2.6rem, 7vw, 5rem)',
      lineHeight: 1.06,
      letterSpacing: '-0.035em',
      margin: '0 0 24px',
      position: 'relative',
      zIndex: 2,
    }}>
      {HEADLINE_WORDS.map((word, i) => {
        const isLast = i === HEADLINE_WORDS.length - 1
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.09, duration: 0.5, ease: 'easeOut' }}
            style={{
              display: 'inline-block',
              marginRight: '0.22em',
              background: isLast
                ? 'linear-gradient(135deg, #3b8cff, #14b8a6)'
                : 'none',
              WebkitBackgroundClip: isLast ? 'text' : 'none',
              WebkitTextFillColor: isLast ? 'transparent' : '#d4e0ef',
              backgroundClip: isLast ? 'text' : 'none',
            }}
          >
            {word}
          </motion.span>
        )
      })}
    </h1>
  )
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '80px 24px',
        background: 'linear-gradient(180deg, rgba(11,18,32,1) 0%, rgba(4,8,15,1) 100%)',
      }}>


        {/* Radial spotlight behind text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(59,140,255,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Hero content & floating phone */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          maxWidth: '1500px',
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Left Text Content */}
          <div style={{ textAlign: 'left', maxWidth: '640px', flex: '1 1 500px' }}>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: '22px' }}
            >
              <span className="badge badge-blue">
                ⛓ PGDM Fintech · Blockchain Module
              </span>
            </motion.div>

            <AnimatedHeadline />

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45 }}
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                color: '#7a8fb0',
                maxWidth: '580px',
                margin: '0 0 38px',
                lineHeight: 1.65,
              }}
            >
              A tamper-evident blockchain ledger for NBFC-to-institution education loan 
              disbursements — every tranche signed, hashed, and chained.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, duration: 0.4 }}
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <Link to="/demo" className="btn-primary" style={{ fontSize: '0.95rem', padding: '13px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Enter the Ledger
              </Link>
              <Link to="/how-it-works" className="btn-ghost" style={{ fontSize: '0.95rem', padding: '13px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} /> How It Works
              </Link>
            </motion.div>

            {/* Hash strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              style={{
                marginTop: '48px',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                opacity: 0.45,
              }}
            >
              {['SHA-256', '·', 'ECDSA', '·', 'PoW / PoS', '·', 'Multi-Node Consensus'].map((t, i) => (
                <span key={i} style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.72rem',
                  color: '#7a8fb0',
                }}>{t}</span>
              ))}
            </motion.div>
          </div>

          {/* Right Floating Phone Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{ 
              opacity: { delay: 0.8, duration: 0.6 },
              scale: { delay: 0.8, duration: 0.6 },
              y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
            }}
            style={{ flexShrink: 0, pointerEvents: 'none' }}
          >
            <PhoneFrame accentColor="#14b8a6" label="" autoScroll={true}>
              <div style={{ padding: '0 8px' }}>
                <div style={{ padding: '12px 4px', borderBottom: '1px solid rgba(20,184,166,0.1)', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.8rem', color: '#2dd4bf' }}>Active Ledger</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6rem', color: '#7a8fb0' }}>Live syncing</div>
                </div>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MiniPreviewBlock 
                    key={i} 
                    amount={`₹${(12000 + i * 2000).toLocaleString('en-IN')}`} 
                    from={['NBFC 2', 'NBFC 1', 'NBFC 3'][i % 3]}
                    milestone={['Admission', 'Semester 1', 'Semester 2'][i % 3]}
                  />
                ))}
              </div>
            </PhoneFrame>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.7rem',
            color: '#243352',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 20,
              height: 30,
              borderRadius: '10px',
              border: '1.5px solid rgba(59,140,255,0.2)',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '5px',
            }}
          >
            <div style={{
              width: 3,
              height: 7,
              borderRadius: '2px',
              background: 'rgba(59,140,255,0.4)',
            }} />
          </motion.div>
        </motion.div>
      </section>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(59,140,255,0.15), transparent)',
        margin: '0 48px',
      }} />

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — THE PROBLEM
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <ScrollSection>
          <SectionHeading
            eyebrow="// the problem"
            title="Why a Shared Ledger Matters"
            sub="Education-finance disbursements touch three or more parties. Without a single source of truth, every handoff is a trust gap."
          />
        </ScrollSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {PROBLEMS.map((card, i) => (
            <ProblemCard key={card.title} card={card} i={i} />
          ))}
        </div>

        {/* Two-layer solution callout */}
        <ScrollSection delay={0.35}>
          <div style={{
            marginTop: '40px',
            padding: '24px 28px',
            borderRadius: '14px',
            background: 'rgba(59,140,255,0.05)',
            border: '1px solid rgba(59,140,255,0.14)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <ShieldCheck size={28} color="#3b82f6" style={{ flexShrink: 0 }} />
            <div>
              <div style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#d4e0ef',
                marginBottom: '6px',
              }}>
                TrancheChain's answer: Two-layer tamper protection
              </div>
              <p style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.85rem',
                color: '#7a8fb0',
                lineHeight: 1.65,
                margin: 0,
              }}>
                <strong style={{ color: '#14b8a6' }}>Layer 1 — Digital Signature (wax seal):</strong>{' '}
                catches tampering before a block is written.{' · '}
                <strong style={{ color: '#3b8cff' }}>Layer 2 — Hash Chain (fingerprint of fingerprints):</strong>{' '}
                alter any block after the fact and every block after it turns red.
              </p>
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.12), transparent)',
        margin: '0 48px',
      }} />

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — THE FLOW
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <ScrollSection>
          <SectionHeading
            eyebrow="// the flow"
            title="Traditional vs TrancheChain Flow"
            sub="Compare the fragmented legacy process with our shared ledger architecture powered by digital signatures and hash-chaining."
          />
        </ScrollSection>

        
        <ScrollSection delay={0.15}>
          <div className="glass-card" style={{ padding: '44px 32px' }}>
            {/* The Broken Traditional Flow */}
            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  The Problem: Traditional Flow
                </span>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#7a8fb0', margin: '8px 0 0' }}>
                  Data is fragmented. Trust relies on manual emails and reconciliation.
                </p>
              </div>
              <TraditionalFlowDiagram />
              
              {/* Traditional Flow Step descriptions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(239,68,68,0.1)',
              }}>
                {[
                  { step: '01', color: '#ef4444', title: 'NBFC logs disbursement', desc: "Recorded only in NBFC's internal system" },
                  { step: '02', color: '#f59e0b', title: 'Sent via email/spreadsheet', desc: "No verification the data wasn't altered in transit" },
                  { step: '03', color: '#ef4444', title: 'Institution re-enters manually', desc: "Human error, no cross-check against NBFC's original record" },
                  { step: '04', color: '#94a3b8', title: 'Reconciliation happens later', desc: "Mismatches surface weeks later, or never" },
                ].map(s => (
                  <div key={s.step} style={{ background: `rgba(239,68,68,0.02)`, border: `1px solid rgba(239,68,68,0.08)`, padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: s.color, marginBottom: '6px' }}>STEP {s.step}</div>
                    <div style={{ fontFamily: 'Manrope', fontSize: '0.75rem', fontWeight: 700, color: '#d4e0ef', marginBottom: '6px' }}>{s.title}</div>
                    <div style={{ fontFamily: 'Manrope', fontSize: '0.7rem', color: '#7a8fb0', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* The TrancheChain Consensus Flow */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                The Solution: TrancheChain Flow
              </span>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#7a8fb0', margin: '8px 0 0' }}>
                All nodes are synchronized. Digital signatures and hash-chaining guarantee data integrity.
              </p>
            </div>
            <FlowDiagram />


            {/* Step descriptions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '40px',
              paddingTop: '28px',
              borderTop: '1px solid rgba(59,140,255,0.08)',
            }}>
              {[
                { step: '01', color: '#3b8cff', title: 'NBFC signs tranche',     desc: 'Private key creates wax seal over the tranche record.' },
                { step: '02', color: '#14b8a6', title: 'Platform validates',      desc: 'Verifies signature, computes SHA-256, proposes new block.' },
                { step: '03', color: '#a78bfa', title: 'Network Consensus',   desc: 'All ledger-holding nodes accept the block via PoW / PoS.' },
                { step: '04', color: '#9badc8', title: 'Institution confirms',    desc: 'Reads its own ledger copy — no need to trust any single party.' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                    color: s.color,
                    opacity: 0.7,
                    letterSpacing: '0.08em',
                  }}>STEP {s.step}</div>
                  <div style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#b8c9df',
                  }}>{s.title}</div>
                  <div style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.78rem',
                    color: '#7a8fb0',
                    lineHeight: 1.55,
                  }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.1), transparent)',
        margin: '0 48px',
      }} />





    </div>
  )
}
