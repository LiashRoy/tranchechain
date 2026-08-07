import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Key, FileText, ShieldCheck, Unlock, BookOpen } from 'lucide-react'
import CryptoJS from 'crypto-js'
import { useIsMobile } from '../hooks/useIsMobile'

/* ═══════════════════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════════════════ */

const sha256 = (str) => CryptoJS.SHA256(str).toString()

const blockContentString = ({ loanId, from, to, amount, milestone, prevHash }) =>
  `${loanId}||${from}||${to}||${amount}||${milestone}||${prevHash}`

const computeBlockHash = (data) => sha256(blockContentString(data))

const trunc = (h, n = 16) => h ? `${h.slice(0, n)}…` : ''

/* ═══════════════════════════════════════════════════════════════════════════════
   STATIC CHAIN DATA (computed once at module level, real hashes)
═══════════════════════════════════════════════════════════════════════════════ */

const GENESIS_PREV = '0000000000000000000000000000000000000000000000000000000000000000'

const BLOCK1_BASE = {
  loanId: 'EDU-2024-001', from: 'NBFC 2', to: 'Partner Institute',
  amount: '₹18,000', milestone: 'Tranche 1 · Admission',
  timestamp: '2024-06-01T09:14:00Z',
}
const BLOCK2_BASE = {
  loanId: 'EDU-2024-001', from: 'NBFC 2', to: 'Partner Institute',
  amount: '₹24,000', milestone: 'Tranche 2 · Mid-Year',
  timestamp: '2024-10-01T11:22:00Z',
}
const BLOCK3_BASE = {
  loanId: 'EDU-2024-001', from: 'NBFC 2', to: 'Partner Institute',
  amount: '₹18,000', milestone: 'Tranche 3 · Final',
  timestamp: '2025-02-01T08:45:00Z',
}

function buildStaticChain(b1Amount = '₹18,000') {
  const b1 = { ...BLOCK1_BASE, amount: b1Amount, prevHash: GENESIS_PREV }
  const b1Hash = computeBlockHash(b1)
  const b2 = { ...BLOCK2_BASE, prevHash: b1Hash }
  const b2Hash = computeBlockHash(b2)
  const b3 = { ...BLOCK3_BASE, prevHash: b2Hash }
  const b3Hash = computeBlockHash(b3)
  return [
    { ...b1, hash: b1Hash, index: 1 },
    { ...b2, hash: b2Hash, index: 2 },
    { ...b3, hash: b3Hash, index: 3 },
  ]
}

const STATIC_CHAIN = buildStaticChain()

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED UI HELPERS
═══════════════════════════════════════════════════════════════════════════════ */

function SectionShell({ id, children, minH = '100vh' }) {
  const isMobile = useIsMobile();
  return (
    <section
      id={id}
      style={{
        minHeight: minH,
        padding: isMobile ? '60px 16px 40px' : '100px 24px 80px',
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {children}
    </section>
  )
}

function SectionLabel({ num, label, color = 'var(--color-electric-blue)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '8px',
        background: `${color}18`, border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
        fontSize: '0.75rem', color,
      }}>{num}</div>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
        color, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'Manrope, sans-serif', fontWeight: 800,
      fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', letterSpacing: '-0.025em',
      color: 'var(--text-primary)', margin: '0 0 14px', lineHeight: 1.15,
    }}>{children}</h2>
  )
}

function SectionSub({ children }) {
  return (
    <p style={{
      fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
      color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: '620px',
    }}>{children}</p>
  )
}

function HashDisplay({ hash, color = 'var(--color-teal)', label, fontSize = '0.82rem' }) {
  const [flash, setFlash] = useState(false)
  const prevHash = useRef(hash)

  useEffect(() => {
    if (hash !== prevHash.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 300)
      prevHash.current = hash
      return () => clearTimeout(t)
    }
  }, [hash])

  return (
    <div>
      {label && (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
          color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: '4px',
        }}>{label}</div>
      )}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize,
        color: flash ? '#fff' : color,
        background: flash ? `${color}30` : `${color}10`,
        border: `1px solid ${color}25`,
        borderRadius: '8px', padding: '10px 14px',
        letterSpacing: '0.04em', wordBreak: 'break-all', lineHeight: 1.5,
        transition: 'color 0.2s, background 0.2s',
      }}>
        {hash || '—'}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 1 — WHAT IS A HASH?
═══════════════════════════════════════════════════════════════════════════════ */

function DiffHash({ hashA, hashB }) {
  if (!hashA || !hashB) return null
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem',
      lineHeight: 1.6, wordBreak: 'break-all', letterSpacing: '0.03em',
    }}>
      {hashB.split('').map((char, i) => {
        const changed = char !== hashA[i]
        return (
          <motion.span
            key={i}
            animate={changed ? { color: ['var(--color-gold)', '#fbbf24'] } : { color: 'var(--color-teal)' }}
            transition={{ duration: 0.3 }}
            style={{
              color: changed ? 'var(--color-gold)' : 'var(--color-teal)',
              fontWeight: changed ? 700 : 400,
            }}
          >
            {char}
          </motion.span>
        )
      })}
    </div>
  )
}

function Section1() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })
  const [input, setInput] = useState('₹18,000 | NBFC 2 → Partner Institute | Tranche 2')

  const currentHash = useMemo(() => sha256(input), [input])

  // Mutate last char to show avalanche effect
  const mutatedInput = useMemo(() => {
    if (!input) return ''
    const last = input[input.length - 1]
    const replacement = last === '2' ? '3' : last === '3' ? '2' : (last.charCodeAt(0) + 1 < 128 ? String.fromCharCode(last.charCodeAt(0) + 1) : 'a')
    return input.slice(0, -1) + replacement
  }, [input])
  const mutatedHash = useMemo(() => sha256(mutatedInput), [mutatedInput])

  return (
    <SectionShell id="s1">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
      >
        <SectionLabel num="01" label="What is a Hash?" color="var(--color-teal)" />
        <SectionTitle>A Fingerprint of Data</SectionTitle>
        <SectionSub>
          Feed any tranche record into SHA-256 and you get a fixed 64-character fingerprint.
          Same input → same output, always. Change even <em>one character</em> → completely different fingerprint.
          And you can never reverse it to find the original data.
        </SectionSub>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {/* Live input */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px',
            }}>
              Tranche record — type anything
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem',
                background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.2)',
                borderRadius: '8px', padding: '12px', color: 'var(--text-primary)',
                resize: 'vertical', outline: 'none', lineHeight: 1.5,
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(59,140,255,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(59,140,255,0.2)' }}
            />
            <div style={{ marginTop: '14px' }}>
              <HashDisplay hash={currentHash} label="SHA-256 fingerprint (live)" />
            </div>
          </div>

          {/* Avalanche demo */}
          <div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(245,158,11,0.2)' }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.85rem',
              color: '#fbbf24', marginBottom: '16px',
            }}>
              ⚡ Avalanche Effect — change one character, everything changes
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Original */}
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                  color: 'var(--color-teal)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
                }}>Original input</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem',
                  color: 'var(--text-secondary)', background: 'rgba(20,184,166,0.06)',
                  border: '1px solid rgba(20,184,166,0.15)', borderRadius: '8px',
                  padding: '10px 12px', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: '10px',
                }}>
                  …{input.slice(-8)}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                  color: 'var(--color-teal)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
                }}>SHA-256</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
                  color: 'var(--color-teal)', lineHeight: 1.6, wordBreak: 'break-all',
                }}>{currentHash}</div>
              </div>

              {/* Mutated */}
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                  color: 'var(--color-gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
                }}>Last char changed</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem',
                  color: 'var(--text-secondary)', background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px',
                  padding: '10px 12px', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: '10px',
                }}>
                  …<span style={{ color: '#fbbf24', fontWeight: 700 }}>{mutatedInput.slice(-8)}</span>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                  color: 'var(--color-gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
                }}>SHA-256 (gold = differs)</div>
                <DiffHash hashA={currentHash} hashB={mutatedHash} />
              </div>
            </div>

            <div style={{
              marginTop: '14px', padding: '10px 14px',
              background: 'rgba(245,158,11,0.07)', borderRadius: '8px',
              border: '1px solid rgba(245,158,11,0.15)',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--text-secondary)',
            }}>
              🟡 Highlighted characters are ones that changed. One tiny edit → completely different fingerprint.
              This is the <strong style={{ color: '#fbbf24' }}>avalanche effect</strong>.
            </div>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 2 — WHAT IS A BLOCK?
═══════════════════════════════════════════════════════════════════════════════ */

const BLOCK_FIELDS = [
  { key: 'loan_id',    label: 'loan_id',     value: 'EDU-2024-001',                color: 'var(--color-electric-blue)', desc: 'Unique loan reference' },
  { key: 'from',       label: 'from_entity', value: 'NBFC 2',                 color: 'var(--color-electric-blue)', desc: 'Disbursing NBFC node' },
  { key: 'to',         label: 'to_entity',   value: 'Partner Institute',             color: 'var(--color-electric-blue)', desc: 'Receiving institution node' },
  { key: 'amount',     label: 'amount',      value: '₹18,000',                     color: 'var(--color-green)', desc: 'Tranche disbursement amount' },
  { key: 'milestone',  label: 'milestone',   value: 'Tranche 2 · Mid-Year Fee',    color: 'var(--color-green)', desc: 'Disbursement condition met' },
  { key: 'timestamp',  label: 'timestamp',   value: '2024-10-01T11:22:00Z',        color: '#a78bfa', desc: 'Block creation time (immutable)' },
  { key: 'prev_hash',  label: 'prev_hash',   value: 'a3f9c2…',                     color: 'var(--color-gold)', desc: 'Fingerprint of the previous block — links the chain' },
  { key: 'this_hash',  label: 'this_hash',   value: 'e7b42d…',                     color: 'var(--color-teal)', desc: 'Fingerprint of THIS block\'s contents' },
  { key: 'signature',  label: 'signature',   value: '3045…(ECDSA)',                color: 'var(--color-red)', desc: 'NBFC 2\'s wax seal — Layer 1 tamper protection' },
]

function Section2() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setVisibleCount(i)
      if (i >= BLOCK_FIELDS.length) clearInterval(iv)
    }, 220)
    return () => clearInterval(iv)
  }, [inView])

  return (
    <SectionShell id="s2">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
      >
        <SectionLabel num="02" label="What is a Block?" color="var(--color-electric-blue)" />
        <SectionTitle>One Page in the Ledger Book</SectionTitle>
        <SectionSub>
          Each block is a page in the public ledger. It records the tranche details, links to the previous
          page via its fingerprint (prev_hash), and is sealed with the NBFC's digital signature.
        </SectionSub>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Animated block */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid rgba(59,140,255,0.12)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)',
                boxShadow: '0 0 6px #10b981',
              }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)',
              }}>Block #2 — Tranche Record</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <AnimatePresence>
                {BLOCK_FIELDS.filter((_, i) => i < visibleCount).map((field) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -12, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '130px 1fr',
                      gap: '8px', alignItems: 'baseline',
                      borderBottom: '1px solid rgba(59,140,255,0.06)',
                      paddingBottom: '6px',
                    }}
                  >
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
                      color: field.color, opacity: 0.85,
                    }}>{field.label}</span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}>{field.value}</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Progress cursor */}
              {visibleCount < BLOCK_FIELDS.length && (
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{
                    width: 8, height: 14, background: 'var(--color-electric-blue)', borderRadius: '2px',
                  }}
                />
              )}
            </div>
          </div>

          {/* Field legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.82rem',
              color: 'var(--text-secondary)', marginBottom: '4px',
            }}>What each field means:</div>
            {BLOCK_FIELDS.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0 }}
                animate={i < visibleCount ? { opacity: 1 } : { opacity: 0.15 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
              >
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                  color: field.color, minWidth: '80px', paddingTop: '2px',
                }}>{field.label}</span>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                  color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>{field.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 3 — CHAINING TRANCHES
═══════════════════════════════════════════════════════════════════════════════ */

function ChainBlock({ block, index, totalBlocks, inView, animDelay }) {
  const isFirst = block.index === 1
  const prevHashDisplay = isFirst ? '0000…0000' : trunc(block.prevHash, 8)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: animDelay, duration: 0.45 }}
      style={{ flex: 1, minWidth: 200, maxWidth: 280 }}
    >
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Block header */}
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid rgba(59,140,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--color-electric-blue)',
          }}>Block #{block.index}</span>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--color-green)',
            boxShadow: '0 0 5px #10b98180',
          }} />
        </div>

        {/* Fields */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            { k: 'from', v: block.from, c: 'var(--text-secondary)' },
            { k: 'to', v: block.to, c: 'var(--text-secondary)' },
            { k: 'amount', v: block.amount, c: 'var(--color-green)' },
            { k: 'milestone', v: block.milestone, c: '#a78bfa' },
          ].map(({ k, v, c }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{k}</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: c,
              }}>{v}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(59,140,255,0.1)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* prev_hash */}
            <div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--color-gold)',
                textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px',
              }}>prev_hash</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
                color: isFirst ? 'var(--text-secondary)' : 'var(--color-gold)',
                background: isFirst ? 'transparent' : 'rgba(245,158,11,0.08)',
                borderRadius: '4px', padding: isFirst ? '0' : '2px 6px',
              }}>{prevHashDisplay}</span>
            </div>

            {/* this_hash */}
            <div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--color-teal)',
                textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px',
              }}>this_hash</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--color-teal)',
                background: 'rgba(20,184,166,0.08)', borderRadius: '4px', padding: '2px 6px',
              }}>{trunc(block.hash, 8)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ChainConnector({ fromHash, toBlock, inView, delay }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '4px', width: '56px', flexShrink: 0,
      paddingTop: '40px',
    }}>
      {/* Animated arrow line */}
      <div style={{ position: 'relative', width: '100%', height: '28px', display: 'flex', alignItems: 'center' }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ delay: delay + 0.2, duration: 0.4 }}
          style={{
            width: '100%', height: '1.5px',
            background: 'linear-gradient(90deg, rgba(245,158,11,0.6), rgba(20,184,166,0.6))',
            transformOrigin: 'left',
          }}
        />
        {/* Travelling pulse */}
        {inView && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: delay + 0.6, ease: 'easeInOut' }}
            style={{
              position: 'absolute', left: 0,
              width: 8, height: 8, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #14b8a6)',
              boxShadow: '0 0 8px rgba(245,158,11,0.6)',
              top: '50%', transform: 'translateY(-50%)',
            }}
          />
        )}
        {/* Arrowhead */}
        <svg style={{ position: 'absolute', right: -4 }} width="8" height="10" viewBox="0 0 8 10">
          <path d="M0 0L8 5L0 10" fill="none" stroke="rgba(20,184,166,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Hash link label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: delay + 0.5 }}
        style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
          color: 'var(--color-gold)', textAlign: 'center', opacity: 0.7,
          lineHeight: 1.3,
        }}
      >
        prev_hash<br />links here
      </motion.div>
    </div>
  )
}

function Section3() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <SectionShell id="s3" minH="auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
      >
        <SectionLabel num="03" label="Chaining Tranches Together" color="var(--color-gold)" />
        <SectionTitle>Pages Linked by Fingerprints</SectionTitle>
        <SectionSub>
          Each block's <span style={{ color: 'var(--color-gold)', fontFamily: 'JetBrains Mono, monospace' }}>prev_hash</span> is
          the fingerprint of the previous block. Change any block and its fingerprint changes — which means every
          block after it contains the wrong prev_hash. The chain exposes the fraud automatically.
        </SectionSub>

        {/* Chain visualization */}
        <div style={{
          overflowX: 'auto', paddingBottom: '8px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0',
            minWidth: '700px',
          }}>
            {STATIC_CHAIN.map((block, i) => (
              <div key={block.index} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                <ChainBlock
                  block={block}
                  index={i}
                  totalBlocks={STATIC_CHAIN.length}
                  inView={inView}
                  animDelay={0.15 + i * 0.2}
                />
                {i < STATIC_CHAIN.length - 1 && (
                  <ChainConnector
                    fromHash={block.hash}
                    toBlock={STATIC_CHAIN[i + 1]}
                    inView={inView}
                    delay={0.3 + i * 0.2}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Callout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          style={{
            marginTop: '28px', padding: '16px 20px',
            background: 'rgba(245,158,11,0.05)', borderRadius: '12px',
            border: '1px solid rgba(245,158,11,0.15)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}
        >
          🔗 The <span style={{ color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>prev_hash</span> in
          each block is a commitment to the entire history before it. This is not metadata — it IS the chain.
          Alter any earlier block and the hash changes, shattering every link after it.
        </motion.div>
      </motion.div>
    </SectionShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 4 — WHY YOU CAN'T REWRITE HISTORY
═══════════════════════════════════════════════════════════════════════════════ */

function TamperBlock({ block, status, isEditing, editAmount, onEditAmount, onEdit, onConfirm, onReset }) {
  const borderColor = status === 'valid' ? 'rgba(16,185,129,0.3)'
    : status === 'invalid' ? 'rgba(239,68,68,0.4)'
    : status === 'tampered' ? 'rgba(245,158,11,0.4)'
    : 'rgba(59,140,255,0.2)'

  const headerBg = status === 'valid' ? 'rgba(16,185,129,0.06)'
    : status === 'invalid' ? 'rgba(239,68,68,0.08)'
    : status === 'tampered' ? 'rgba(245,158,11,0.08)'
    : 'rgba(59,140,255,0.06)'

  const dotColor = status === 'valid' ? 'var(--color-green)'
    : status === 'invalid' ? 'var(--color-red)'
    : status === 'tampered' ? 'var(--color-gold)'
    : 'var(--color-electric-blue)'

  const statusLabel = status === 'valid' ? '✓ Valid'
    : status === 'invalid' ? '✗ Invalid — hash mismatch'
    : status === 'tampered' ? '⚠ Tampered'
    : '●'

  return (
    <motion.div
      animate={status === 'invalid' ? {
        x: [0, -4, 4, -2, 2, 0],
        transition: { duration: 0.4 }
      } : {}}
      style={{ flex: 1, minWidth: 200 }}
    >
      <div style={{
        borderRadius: '12px', overflow: 'hidden',
        border: `1.5px solid ${borderColor}`,
        transition: 'border-color 0.4s ease',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${borderColor}`,
          background: headerBg, transition: 'background 0.4s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '6px',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--text-secondary)',
          }}>Block #{block.index}</span>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.65rem',
            color: dotColor, transition: 'color 0.4s',
          }}>{statusLabel}</span>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>from</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{block.from}</span>
          </div>

          {/* Editable amount */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>amount</span>
            {isEditing ? (
              <input
                value={editAmount}
                onChange={e => onEditAmount(e.target.value)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem',
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.5)',
                  borderRadius: '6px', padding: '4px 8px', color: '#fbbf24', outline: 'none', width: '100%',
                }}
                autoFocus
              />
            ) : (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem',
                color: status === 'tampered' ? '#fbbf24' : 'var(--color-green)',
                fontWeight: 700,
              }}>{block.amount}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>milestone</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#a78bfa' }}>{block.milestone}</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(59,140,255,0.08)', paddingTop: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: status === 'invalid' ? 'var(--color-red)' : 'var(--color-gold)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>prev_hash</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              color: status === 'invalid' ? '#ef444488' : '#f59e0b88',
              textDecoration: status === 'invalid' ? 'line-through' : 'none',
            }}>{trunc(block.prevHash, 8)}</span>
          </div>

          <div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--color-teal)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>this_hash</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#14b8a688' }}>{trunc(block.hash, 8)}</span>
          </div>
        </div>

        {/* Action row for block 1 only */}
        {block.index === 1 && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: '8px' }}>
            {!isEditing ? (
              <button
                onClick={onEdit}
                style={{
                  flex: 1, padding: '7px', borderRadius: '7px',
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#fbbf24', fontFamily: 'Manrope, sans-serif', fontWeight: 600,
                  fontSize: '0.75rem', cursor: 'pointer',
                }}
              >
                ✏ Edit Amount
              </button>
            ) : (
              <>
                <button
                  onClick={onConfirm}
                  style={{
                    flex: 1, padding: '7px', borderRadius: '7px',
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    color: '#f87171', fontFamily: 'Manrope, sans-serif', fontWeight: 700,
                    fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  Tamper!
                </button>
                <button
                  onClick={onReset}
                  style={{
                    padding: '7px 10px', borderRadius: '7px',
                    background: 'transparent', border: '1px solid rgba(59,140,255,0.2)',
                    color: 'var(--text-secondary)', fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                    fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function BrokenConnector({ broken }) {
  return (
    <div style={{
      width: '44px', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      paddingTop: '50px', gap: '3px',
    }}>
      <motion.div
        animate={broken ? {
          background: ['rgba(239,68,68,0.6)', 'rgba(239,68,68,0.2)', 'rgba(239,68,68,0.6)'],
          scaleX: [1, 0.4, 0],
        } : { scaleX: 1, background: 'rgba(20,184,166,0.4)' }}
        transition={{ duration: broken ? 0.5 : 0.3 }}
        style={{
          width: '100%', height: '2px', borderRadius: '1px',
          background: broken ? 'rgba(239,68,68,0.3)' : 'rgba(20,184,166,0.4)',
          transformOrigin: 'left',
        }}
      />
      {broken && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            fontSize: '0.9rem', lineHeight: 1,
          }}
        >💥</motion.span>
      )}
    </div>
  )
}

function Section4() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [chain, setChain] = useState(STATIC_CHAIN)
  const [statuses, setStatuses] = useState(['valid', 'valid', 'valid'])
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(STATIC_CHAIN[0].amount)
  const [isTampered, setIsTampered] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
    setEditAmount(chain[0].amount)
  }

  const handleReset = () => {
    setIsEditing(false)
    setEditAmount(chain[0].amount)
  }

  const handleConfirm = useCallback(() => {
    setIsEditing(false)
    // Rebuild chain with tampered amount
    const newChain = buildStaticChain(editAmount)
    // Mark block 1 as tampered with new hash
    const tamperedChain = [
      { ...newChain[0], amount: editAmount },
      // Block 2 and 3 keep their ORIGINAL prevHash (now mismatched)
      { ...chain[1] },
      { ...chain[2] },
    ]
    setChain(tamperedChain)
    setStatuses(['tampered', 'valid', 'valid'])
    setIsTampered(true)

    // Cascade invalidation
    setTimeout(() => {
      setStatuses(['tampered', 'invalid', 'valid'])
    }, 600)
    setTimeout(() => {
      setStatuses(['tampered', 'invalid', 'invalid'])
    }, 1100)
  }, [editAmount, chain])

  const handleFullReset = () => {
    setChain(STATIC_CHAIN)
    setStatuses(['valid', 'valid', 'valid'])
    setIsTampered(false)
    setIsEditing(false)
    setEditAmount(STATIC_CHAIN[0].amount)
  }

  return (
    <SectionShell id="s4">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
      >
        <SectionLabel num="04" label="Why You Can't Rewrite History" color="var(--color-red)" />
        <SectionTitle>Edit One Block. Break the Chain.</SectionTitle>
        <SectionSub>
          Click "Edit Amount" on Block #1, change the tranche value, then hit "Tamper!" — watch
          every block after it become invalid in real time. This is Layer 2 protection.
        </SectionSub>

        {/* Tamper chain */}
        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '680px', gap: '0' }}>
            {chain.map((block, i) => (
              <div key={block.index} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                <TamperBlock
                  block={block}
                  status={statuses[i]}
                  isEditing={isEditing && block.index === 1}
                  editAmount={editAmount}
                  onEditAmount={setEditAmount}
                  onEdit={handleEdit}
                  onConfirm={handleConfirm}
                  onReset={handleReset}
                />
                {i < chain.length - 1 && (
                  <BrokenConnector broken={statuses[i + 1] === 'invalid'} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status / explanation */}
        <AnimatePresence mode="wait">
          {!isTampered ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '20px', padding: '14px 18px',
                background: 'rgba(16,185,129,0.06)', borderRadius: '10px',
                border: '1px solid rgba(16,185,129,0.18)',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: 'var(--text-secondary)',
              }}
            >
              ✅ All 3 blocks valid — prev_hash chains are intact.
              Click <strong style={{ color: '#fbbf24' }}>Edit Amount</strong> on Block #1 to start the demo.
            </motion.div>
          ) : (
            <motion.div
              key="tampered"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '20px', padding: '14px 18px',
                background: 'rgba(239,68,68,0.07)', borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.25)',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: 'var(--text-secondary)',
              }}
            >
              🔴 Block #1's fingerprint changed when you altered the amount.
              Blocks #2 and #3 still reference the <em>old</em> fingerprint in their prev_hash — mismatch detected.
              The ledger exposes the fraud automatically.
              <button
                onClick={handleFullReset}
                style={{
                  marginLeft: '16px', padding: '4px 12px', borderRadius: '6px',
                  background: 'rgba(59,140,255,0.1)', border: '1px solid rgba(59,140,255,0.25)',
                  color: '#6aaeff', fontFamily: 'Manrope, sans-serif', fontWeight: 600,
                  fontSize: '0.76rem', cursor: 'pointer',
                }}
              >
                Reset chain
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </SectionShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 5 — WHO SIGNS WHAT
═══════════════════════════════════════════════════════════════════════════════ */

function Section5() {
  const isMobile = useIsMobile();
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [inView])

  return (
    <SectionShell id="s5">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
      >
        <SectionLabel num="05" label="Who Signs What" color="#a78bfa" />
        <SectionTitle>The Wax Seal — NBFC as Signer</SectionTitle>
        <SectionSub>
          Cryptographic keys work like a trapdoor: easy to go from private → public, practically
          impossible to reverse. The digital signature is NBFC 2's wax seal — bound to both
          their private key AND the exact tranche message.
        </SectionSub>

        {/* Signing flow */}
        <div className="glass-card" style={{ padding: isMobile ? '24px 20px' : '32px 28px', marginBottom: '20px' }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.85rem',
            color: 'var(--text-secondary)', marginBottom: '24px',
          }}>Signing a tranche (Layer 1 protection):</div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0',
            flexWrap: 'wrap', rowGap: '16px',
          }}>
            {/* Private key */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={step >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35 }}
              style={{
                padding: '16px 18px', borderRadius: '12px',
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
                textAlign: 'center', minWidth: '160px',
              }}
            >
              <div style={{ marginBottom: '6px' }}><Key size={26} color="#a78bfa" /></div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                color: '#a78bfa', marginBottom: '4px',
              }}>Private Key</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                NBFC 2 only
              </div>
            </motion.div>

            {/* Plus */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={step >= 1 ? { opacity: 1 } : {}}
              style={{ padding: '0 14px', color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 300 }}
            >+</motion.span>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={step >= 2 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35 }}
              style={{
                padding: '16px 18px', borderRadius: '12px', flex: 1,
                background: 'var(--glass-border)', border: '1px solid rgba(59,140,255,0.25)',
                minWidth: '200px',
              }}
            >
              <div style={{ marginBottom: '6px' }}><FileText size={26} color="#6aaeff" /></div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                color: '#6aaeff', marginBottom: '8px',
              }}>Tranche Message</div>
              {[
                'loan_id: EDU-2024-001',
                'amount: ₹18,000',
                'to: Partner Institute',
                'milestone: Tranche 2',
              ].map(line => (
                <div key={line} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text-secondary)',
                }}>{line}</div>
              ))}
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={step >= 2 ? { opacity: 1 } : {}}
              style={{ padding: '0 14px', color: 'var(--text-secondary)', fontSize: '1.4rem' }}
            >→</motion.div>

            {/* Signature output */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={step >= 3 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35 }}
              style={{
                padding: '16px 18px', borderRadius: '12px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                textAlign: 'center', minWidth: '160px',
              }}
            >
              <div style={{ marginBottom: '6px' }}><ShieldCheck size={26} color="#34d399" /></div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                color: '#34d399', marginBottom: '4px',
              }}>Digital Signature</div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-secondary)',
              }}>3045 0221 00a3…</div>
            </motion.div>
          </div>
        </div>

        {/* Verification row */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.85rem',
            color: 'var(--text-secondary)', marginBottom: '20px',
          }}>Verification (anyone can do this — only NBFC 2 could have created it):</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', rowGap: '16px' }}>
            {[
              { label: 'Public Key', sub: '(Published by NBFC 2)', icon: <Unlock size={22} color="#a78bfa" />, color: '#a78bfa' },
              { label: '+', sub: '', icon: null, color: 'var(--text-secondary)' },
              { label: 'Signature', sub: '(from the block)', icon: <ShieldCheck size={22} color="var(--color-green)" />, color: 'var(--color-green)' },
              { label: '+', sub: '', icon: null, color: 'var(--text-secondary)' },
              { label: 'Message', sub: '(exact tranche data)', icon: <FileText size={22} color="var(--color-electric-blue)" />, color: 'var(--color-electric-blue)' },
              { label: '→', sub: '', icon: null, color: 'var(--text-secondary)' },
              { label: '✓ Authentic', sub: 'Only NBFC 2\'s key\ncould produce this seal', icon: null, color: 'var(--color-green)' },
            ].map((item, i) => (
              item.icon !== null || item.label === '→' || item.label === '+' ? (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: item.label !== '→' && item.label !== '+' ? 1 : 'unset',
                  fontFamily: item.label === '→' || item.label === '+' ? 'inherit' : 'Manrope, sans-serif',
                  color: item.color, fontSize: item.label === '→' || item.label === '+' ? '1.2rem' : '0.75rem',
                  fontWeight: item.label === '✓ Authentic' ? 700 : 500,
                  padding: item.label !== '→' && item.label !== '+' ? '10px 14px' : '0',
                  background: item.icon != null ? `${item.color}10` : 'transparent',
                  border: item.icon != null ? `1px solid ${item.color}25` : 'none',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}>
                  {item.icon && <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.sub && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'pre' }}>{item.sub}</span>}
                </div>
              ) : (
                <span key={i} style={{ color: item.color, fontSize: '1.2rem' }}>{item.label}</span>
              )
            ))}
          </div>

          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'rgba(239,68,68,0.06)', borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.15)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--text-secondary)',
          }}>
            <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '4px' }} /> Change even one rupee in the amount after signing — the wax seal breaks. This is
            why the signature field in every block is bound to the <em>exact</em> message content.
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 6 — MULTIPLE STAKEHOLDERS, ONE TRUTH
═══════════════════════════════════════════════════════════════════════════════ */

const NODES = [
  { id: 'nbfc',     icon: '🏦', label: 'NBFC Node',              sub: 'NBFC 2 · NBFC 1',      color: 'var(--color-electric-blue)' },
  { id: 'platform', icon: '🔗', label: 'Fintech Company Node', sub: 'Education Finance Intermediary', color: 'var(--color-teal)' },
  { id: 'inst',     icon: '🏫', label: 'Institution Node',        sub: 'Partner Institute',                color: '#a78bfa' },
]

function Section6() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [blockCount, setBlockCount] = useState(3)
  const [syncing, setSyncing] = useState(false)
  const [newBlockVisible, setNewBlockVisible] = useState(false)

  const addBlock = () => {
    if (syncing) return
    setSyncing(true)
    setNewBlockVisible(true)
    setTimeout(() => {
      setBlockCount(c => c + 1)
      setSyncing(false)
      setNewBlockVisible(false)
    }, 1800)
  }

  return (
    <SectionShell id="s6">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
      >
        <SectionLabel num="06" label="Multiple Stakeholders, One Truth" color="var(--color-teal)" />
        <SectionTitle>The Village Council — No Single Authority</SectionTitle>
        <SectionSub>
          NBFC, Fintech Company-style platform, and institution each hold a full copy of the chain.
          Like Wikipedia — anyone can read it, you trust the mathematics, not an institution.
          When a new tranche block is added, it broadcasts to every node simultaneously.
        </SectionSub>

        {/* Node grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px', marginBottom: '28px',
        }}>
          {NODES.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i }}
            >
              <motion.div
                animate={syncing ? {
                  boxShadow: [
                    `0 0 0px ${node.color}00`,
                    `0 0 28px ${node.color}60`,
                    `0 0 8px ${node.color}30`,
                    `0 0 0px ${node.color}00`,
                  ],
                  borderColor: [
                    `${node.color}20`,
                    `${node.color}80`,
                    `${node.color}40`,
                    `${node.color}20`,
                  ],
                } : {}}
                transition={syncing ? { duration: 1.8, delay: i * 0.12 } : {}}
                className="glass-card"
                style={{ padding: '24px 20px', borderColor: `${node.color}20` }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '14px',
                  background: `${node.color}14`, border: `1px solid ${node.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: '14px',
                }}>
                  {node.icon}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                  color: node.color, opacity: 0.8, textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '4px',
                }}>
                  {node.label}
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {node.sub}
                </div>

                {/* Mini chain indicator */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {Array.from({ length: blockCount }).map((_, bi) => (
                    <motion.div
                      key={bi}
                      initial={bi === blockCount - 1 && newBlockVisible ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.12, duration: 0.35 }}
                      style={{
                        width: 18, height: 18, borderRadius: '4px',
                        background: `${node.color}20`, border: `1px solid ${node.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '2px', background: node.color, opacity: 0.7 }} />
                    </motion.div>
                  ))}
                  {/* Connector dots */}
                  {Array.from({ length: Math.max(0, blockCount - 1) }).map((_, ci) => null)}
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    {blockCount} blocks
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Add block button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <button
            onClick={addBlock}
            disabled={syncing}
            style={{
              padding: '13px 32px', borderRadius: '10px',
              background: syncing
                ? 'rgba(20,184,166,0.08)'
                : 'linear-gradient(135deg, rgba(20,184,166,0.18), rgba(59,140,255,0.12))',
              border: `1px solid ${syncing ? 'rgba(20,184,166,0.4)' : 'rgba(20,184,166,0.3)'}`,
              color: syncing ? 'var(--color-teal)' : '#2dd4bf',
              fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.9rem',
              cursor: syncing ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
          >
            {syncing ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >⚙</motion.span>
                Broadcasting to all nodes…
              </>
            ) : (
              <>⛓ Add Tranche Block — Broadcast to All Nodes</>
            )}
          </button>

          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center',
          }}>
            Nodes vs Transactors: NBFC · Platform · Institution are nodes — they hold the full ledger.
            The student/guardian is a transactor — they only need a wallet.
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FLOATING CTA
═══════════════════════════════════════════════════════════════════════════════ */

function FloatingCTA() {
  const triggerRef = useRef(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const s3 = document.getElementById('s3')
    if (!s3) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShow(true) },
      { threshold: 0.2 }
    )
    observer.observe(s3)
    return () => observer.disconnect()
  }, [])

  return null
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION DIVIDER
═══════════════════════════════════════════════════════════════════════════════ */
function Divider({ color = 'rgba(59,140,255,0.1)' }) {
  return (
    <div style={{
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      margin: '0 48px',
    }} />
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════════ */

export default function HowItWorks() {
  const isMobile = useIsMobile();
  return (
    <div>
      {/* Page hero */}
      <div style={{
        padding: isMobile ? '40px 16px 0' : '72px 24px 0', maxWidth: 1400, margin: '0 auto', textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="badge badge-blue" style={{ marginBottom: '16px', display: 'inline-flex' }}>
            🎓 Concept Walkthrough — Scroll to explore
          </span>
          <h1 style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3.4rem)', letterSpacing: '-0.03em',
            color: 'var(--text-primary)', margin: '0 0 14px',
          }}>
            How TrancheChain Works
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--text-secondary)',
            maxWidth: '560px', margin: '0 auto 0', lineHeight: 1.65,
          }}>
            Six concepts. One running example: NBFC 2 disbursing education loan
            tranches to Partner Institute. Each section maps to your course material exactly.
          </p>
        </motion.div>
      </div>

      {/* Sections */}
      <Section1 />
      <Divider color="rgba(20,184,166,0.1)" />
      <Section2 />
      <Divider color="rgba(59,140,255,0.1)" />
      <Section3 />
      <Divider color="rgba(245,158,11,0.1)" />
      <Section4 />
      <Divider color="rgba(239,68,68,0.1)" />
      <Section5 />
      <Divider color="rgba(167,139,250,0.1)" />
      <Section6 />

      {/* Bottom CTA */}
      <div style={{ padding: '32px 24px 80px', textAlign: 'center' }}>
        <Link to="/demo" className="btn-primary" style={{ fontSize: '1rem', padding: '14px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} /> Enter the Full Ledger Demo →
        </Link>
      </div>

      <FloatingCTA />
    </div>
  )
}
