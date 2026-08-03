import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   REAL ECDSA P-256 (Web Crypto API — no mocks)
═══════════════════════════════════════════════════════════════════════════ */

const bufToHex = (buf) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')

const msgOf = ({ from, to, amount, milestone }) =>
  `LOAN:EDU-2024-001 | FROM:${from} | TO:${to} | AMOUNT:${amount} | MILESTONE:${milestone}`

async function genKeyPair() {
  const kp = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']
  )
  const [privRaw, pubRaw] = await Promise.all([
    window.crypto.subtle.exportKey('pkcs8', kp.privateKey),
    window.crypto.subtle.exportKey('spki',  kp.publicKey),
  ])
  return {
    privateKey: kp.privateKey, publicKey: kp.publicKey,
    privHex: bufToHex(privRaw), pubHex: bufToHex(pubRaw),
  }
}

async function signMsg(privateKey, msg) {
  const buf = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privateKey,
    new TextEncoder().encode(msg)
  )
  return { sigBuf: buf, sigHex: bufToHex(buf) }
}

async function verifyMsg(publicKey, msg, sigBuf) {
  return window.crypto.subtle.verify(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    publicKey,
    sigBuf,
    new TextEncoder().encode(msg)
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }, [text])

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 6, border: 'none',
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,140,255,0.1)',
        color: copied ? '#34d399' : '#6aaeff',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem',
        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {copied ? (
        <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Copied!</>
      ) : (
        <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</>
      )}
    </button>
  )
}

function HexCard({ label, value, icon, color, note, glow = false }) {
  const [expanded, setExpanded] = useState(false)
  const display = expanded ? value : value.slice(0, 48) + '…'

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: `1.5px solid ${color}30`,
      background: `${color}08`,
      boxShadow: glow ? `0 0 24px ${color}20` : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${color}18`,
        background: `${color}0a`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
            color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
          }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CopyButton text={value} />
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              padding: '3px 8px', borderRadius: 5, border: 'none',
              background: 'rgba(255,255,255,0.05)', color: '#7a8fb0',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.62rem',
              cursor: 'pointer',
            }}
          >{expanded ? 'collapse' : 'expand'}</button>
        </div>
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
          color, lineHeight: 1.55, wordBreak: 'break-all', letterSpacing: '0.02em',
        }}>{display}</div>
        {note && (
          <div style={{
            marginTop: 8, fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
            color: '#7a8fb0', fontStyle: 'italic',
          }}>{note}</div>
        )}
      </div>
    </div>
  )
}

function TrancheMsgCard({ tranche, editable = false, editAmount, onEditAmount }) {
  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1.5px solid rgba(59,140,255,0.2)',
      background: 'rgba(59,140,255,0.05)',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid rgba(59,140,255,0.12)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(59,140,255,0.06)',
      }}>
        <span style={{ fontSize: '0.9rem' }}>📋</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color: '#6aaeff', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>Tranche Message (to be signed)</span>
      </div>
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          { k: 'LOAN',      v: 'EDU-2024-001',    c: '#7a8fb0' },
          { k: 'FROM',      v: tranche.from,       c: '#14b8a6' },
          { k: 'TO',        v: tranche.to,         c: '#14b8a6' },
          { k: 'MILESTONE', v: tranche.milestone,  c: '#a78bfa' },
        ].map(({ k, v, c }) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#243352', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: c }}>{v}</span>
          </div>
        ))}
        {/* Amount row — conditionally editable */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#243352', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AMOUNT</span>
          {editable ? (
            <input
              value={editAmount}
              onChange={e => onEditAmount(e.target.value)}
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem',
                fontWeight: 700, background: 'rgba(245,158,11,0.1)',
                border: '1.5px solid rgba(245,158,11,0.4)',
                borderRadius: 6, padding: '4px 10px',
                color: '#fbbf24', outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.7)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(245,158,11,0.4)' }}
            />
          ) : (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>{tranche.amount}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  { n: 1, label: 'Generate Keys' },
  { n: 2, label: 'Sign Tranche' },
  { n: 3, label: 'Verify' },
  { n: 4, label: 'Try to Tamper' },
]

function ProgressBar({ activeStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => {
        const done    = s.n < activeStep
        const current = s.n === activeStep
        const future  = s.n > activeStep
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            {/* Step circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <motion.div
                animate={{
                  background: done ? '#10b981' : current ? '#3b8cff' : 'rgba(255,255,255,0.05)',
                  borderColor: done ? '#10b981' : current ? '#3b8cff' : 'rgba(255,255,255,0.12)',
                  boxShadow: current ? '0 0 18px rgba(59,140,255,0.45)' : 'none',
                }}
                transition={{ duration: 0.35 }}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '2px solid',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <motion.svg initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </motion.svg>
                ) : (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    fontSize: '0.78rem',
                    color: current ? '#fff' : '#243352',
                  }}>{s.n}</span>
                )}
              </motion.div>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.68rem',
                color: done ? '#10b981' : current ? '#6aaeff' : '#243352',
                fontWeight: current ? 700 : 500,
                whiteSpace: 'nowrap', transition: 'color 0.3s',
              }}>{s.label}</span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <motion.div
                animate={{ background: done ? '#10b98160' : 'rgba(255,255,255,0.07)' }}
                transition={{ duration: 0.4 }}
                style={{ flex: 1, height: 2, borderRadius: 1, marginBottom: 22 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1 — GENERATE KEYS
═══════════════════════════════════════════════════════════════════════════ */

function Step1({ onComplete }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'generating' | 'done'
  const [keys, setKeys] = useState(null)

  const handleGenerate = useCallback(async () => {
    setPhase('generating')
    try {
      const k = await genKeyPair()
      setKeys(k)
      setPhase('done')
    } catch (e) {
      console.error(e)
      setPhase('idle')
    }
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color: '#3b8cff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>Step 1 of 4</div>
        <h2 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#d4e0ef',
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>Generate NBFC Key Pair</h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
          color: '#7a8fb0', margin: 0, lineHeight: 1.6, maxWidth: 600,
        }}>
          NBFC 2 generates an ECDSA P-256 key pair. The private key is a trapdoor — easy to
          derive the public key from it, computationally infeasible to reverse.
        </p>
      </div>

      {/* Generate button */}
      {phase === 'idle' && (
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 30px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #3b8cff, #1d6fe8)',
            color: '#fff', fontFamily: 'Manrope, sans-serif',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(59,140,255,0.3)',
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🔑</span>
          Generate NBFC Key Pair (ECDSA P-256)
        </motion.button>
      )}

      {phase === 'generating' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderRadius: 10,
          background: 'rgba(59,140,255,0.07)',
          border: '1px solid rgba(59,140,255,0.2)',
          marginBottom: 24, width: 'fit-content',
        }}>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', fontSize: '1.1rem' }}
          >⚙</motion.span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: '#6aaeff' }}>
            Generating P-256 key pair via Web Crypto API…
          </span>
        </div>
      )}

      {/* Keys display */}
      <AnimatePresence>
        {phase === 'done' && keys && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Diagram: private → (trapdoor) → public */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 16, alignItems: 'center',
            }}>
              {/* Private key block */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <HexCard
                  label="Private Key — NBFC 2 ONLY"
                  value={keys.privHex}
                  icon="🔒"
                  color="#ef4444"
                  note="NEVER shared. Used only to sign. Without this, no one can forge NBFC 2's signature."
                  glow
                />
              </motion.div>

              {/* Arrow */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 22 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  flexShrink: 0,
                }}
              >
                <div style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.62rem',
                  color: '#7a8fb0', textAlign: 'center', lineHeight: 1.4,
                  maxWidth: 80,
                }}>Trapdoor<br />function<br />(one-way)</div>
                <div style={{ fontSize: '1.4rem', color: '#3b8cff' }}>→</div>
              </motion.div>

              {/* Public key block */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <HexCard
                  label="Public Key — Shared openly"
                  value={keys.pubHex}
                  icon="🔓"
                  color="#10b981"
                  note="Published by NBFC 2. Anyone can use it to verify signatures — cannot be used to sign."
                  glow
                />
              </motion.div>
            </div>

            {/* Callout */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                padding: '12px 18px', borderRadius: 9,
                background: 'rgba(59,140,255,0.06)',
                border: '1px solid rgba(59,140,255,0.15)',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
                color: '#7a8fb0', lineHeight: 1.6,
              }}
            >
              🔑 These are <strong style={{ color: '#6aaeff' }}>real ECDSA P-256 keys</strong> freshly generated
              by your browser's Web Crypto API. The private key is a 256-bit secret. From it, the public key
              is derived as a point on the elliptic curve — but you cannot go backwards.
            </motion.div>

            {/* Next button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete(keys)}
              style={{
                alignSelf: 'flex-start',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 26px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontFamily: 'Manrope, sans-serif',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(16,185,129,0.3)',
              }}
            >
              Next: Sign a Tranche
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — SIGN A TRANCHE
═══════════════════════════════════════════════════════════════════════════ */

function Step2({ keys, tranche, onComplete }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'combining' | 'signed'
  const [sig, setSig] = useState(null)

  const handleSign = useCallback(async () => {
    setPhase('combining')
    try {
      const msg = msgOf(tranche)
      const result = await signMsg(keys.privateKey, msg)
      setTimeout(() => {
        setSig(result)
        setPhase('signed')
      }, 1200)
    } catch (e) {
      console.error(e)
      setPhase('idle')
    }
  }, [keys, tranche])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>Step 2 of 4</div>
        <h2 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#d4e0ef',
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>Sign a Tranche</h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
          color: '#7a8fb0', margin: 0, lineHeight: 1.6, maxWidth: 600,
        }}>
          NBFC 2 applies their private key to the exact tranche message to produce a
          digital signature — their wax seal. The signature is mathematically bound to both
          the private key <em>and</em> this exact message.
        </p>
      </div>

      {/* Tranche message */}
      <div style={{ marginBottom: 20 }}>
        <TrancheMsgCard tranche={tranche} />
      </div>

      {/* Combining animation */}
      <AnimatePresence mode="wait">
        {phase === 'combining' && (
          <motion.div
            key="combining"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 16, padding: '24px', marginBottom: 20,
              background: 'rgba(59,140,255,0.04)',
              borderRadius: 12, border: '1px solid rgba(59,140,255,0.12)',
              flexWrap: 'wrap',
            }}
          >
            {/* Private key */}
            <motion.div
              animate={{ x: [0, 20], opacity: [1, 0.6] }}
              transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
              style={{
                padding: '10px 16px', borderRadius: 9,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#f87171',
                maxWidth: 140, textAlign: 'center',
              }}
            >
              🔒 Private Key
            </motion.div>

            {/* Plus */}
            <span style={{ color: '#7a8fb0', fontSize: '1.3rem', fontWeight: 300 }}>+</span>

            {/* Message */}
            <motion.div
              animate={{ x: [0, -20], opacity: [1, 0.6] }}
              transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
              style={{
                padding: '10px 16px', borderRadius: 9,
                background: 'rgba(59,140,255,0.1)', border: '1px solid rgba(59,140,255,0.3)',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#6aaeff',
                maxWidth: 140, textAlign: 'center',
              }}
            >
              📋 Tranche Message
            </motion.div>

            <span style={{ color: '#7a8fb0', fontSize: '1.3rem' }}>→</span>

            {/* ECDSA output */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{
                padding: '10px 16px', borderRadius: 9,
                background: 'rgba(16,185,129,0.1)', border: '1px dashed rgba(16,185,129,0.4)',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#34d399',
                maxWidth: 140, textAlign: 'center',
              }}
            >
              🪬 ECDSA(SHA-256)…
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign button */}
      {phase === 'idle' && (
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSign}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 28px', borderRadius: 11, border: 'none',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            color: '#fff', fontFamily: 'Manrope, sans-serif',
            fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
            boxShadow: '0 6px 22px rgba(20,184,166,0.3)',
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🔏</span>
          Sign with Private Key (ECDSA P-256 · SHA-256)
        </motion.button>
      )}

      {/* Signature result */}
      <AnimatePresence>
        {phase === 'signed' && sig && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, type: 'spring', stiffness: 240, damping: 24 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <HexCard
              label="Digital Signature (ECDSA P-256)"
              value={sig.sigHex}
              icon="🪬"
              color="#10b981"
              note="This signature is uniquely bound to NBFC 2's private key AND the exact tranche message above. Change even one character in the message → signature becomes invalid."
              glow
            />

            <div style={{
              padding: '12px 16px', borderRadius: 9,
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.15)',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
              color: '#7a8fb0', lineHeight: 1.6,
            }}>
              🪬 The wax seal is applied. Anyone with NBFC 2's <strong style={{ color: '#34d399' }}>public key</strong> can
              verify this — but only NBFC 2 (holder of the private key) could have <em>created</em> it.
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete(sig)}
              style={{
                alignSelf: 'flex-start',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 26px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontFamily: 'Manrope, sans-serif',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(16,185,129,0.3)',
              }}
            >
              Next: Verify the Signature
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3 — VERIFY
═══════════════════════════════════════════════════════════════════════════ */

function Step3({ keys, tranche, sig, onComplete }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'verifying' | 'valid'

  const handleVerify = useCallback(async () => {
    setPhase('verifying')
    try {
      const msg = msgOf(tranche)
      const valid = await verifyMsg(keys.publicKey, msg, sig.sigBuf)
      setTimeout(() => setPhase(valid ? 'valid' : 'invalid'), 800)
    } catch (e) {
      console.error(e)
      setPhase('idle')
    }
  }, [keys, tranche, sig])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>Step 3 of 4</div>
        <h2 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#d4e0ef',
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>Verify the Signature</h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
          color: '#7a8fb0', margin: 0, lineHeight: 1.6, maxWidth: 600,
        }}>
          Anyone — the institution, the regulator, the auditor — can verify this signature
          using <strong style={{ color: '#34d399' }}>only the public key, the message, and the signature</strong>.
          No private key required. No trust in any institution required.
        </p>
      </div>

      {/* Inputs shown */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12, marginBottom: 20,
      }}>
        <HexCard label="Public Key (NBFC 2)" value={keys.pubHex} icon="🔓" color="#10b981" />
        <TrancheMsgCard tranche={tranche} />
        <HexCard label="Signature (from block)" value={sig.sigHex} icon="🪬" color="#14b8a6" />
      </div>

      {/* Verify button */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={handleVerify}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 28px', borderRadius: 11, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontFamily: 'Manrope, sans-serif',
                fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                boxShadow: '0 6px 22px rgba(16,185,129,0.3)',
                marginBottom: 20,
              }}
            >
              <span>🔍</span> Verify Signature (Public Key Only)
            </button>
          </motion.div>
        )}

        {phase === 'verifying' && (
          <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px', borderRadius: 10,
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.2)',
              marginBottom: 20, width: 'fit-content',
            }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '1.1rem' }}
            >⚙</motion.span>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', color: '#34d399' }}>
              Running ECDSA verification…
            </span>
          </motion.div>
        )}

        {phase === 'valid' && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              padding: '28px 32px', borderRadius: 14, marginBottom: 24,
              background: 'rgba(16,185,129,0.1)',
              border: '2px solid rgba(16,185,129,0.4)',
              boxShadow: '0 0 48px rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 350, damping: 20 }}
              style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(16,185,129,0.2)',
                border: '2.5px solid #10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 24px rgba(16,185,129,0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </motion.div>
            <div>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                fontSize: '1.3rem', color: '#10b981', marginBottom: 4,
              }}>✓ Signature Valid</div>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem',
                color: '#34d39990',
              }}>Authorized by NBFC 2 · P-256 ECDSA · SHA-256</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      <AnimatePresence>
        {phase === 'valid' && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 26px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontFamily: 'Manrope, sans-serif',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(245,158,11,0.3)',
            }}
          >
            <span>🔨</span> Next: Try to Tamper
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 4 — TRY TO TAMPER
═══════════════════════════════════════════════════════════════════════════ */

function Step4({ keys, tranche, sig }) {
  const [editAmount, setEditAmount] = useState(tranche.amount)
  const [phase, setPhase] = useState('idle') // 'idle' | 'verifying' | 'invalid' | 'valid'
  const [shakeKey, setShakeKey] = useState(0)

  const tamperedTranche = { ...tranche, amount: editAmount }
  const isActuallyTampered = editAmount.trim() !== tranche.amount.trim()

  const handleVerify = useCallback(async () => {
    setPhase('verifying')
    try {
      const msg = msgOf(tamperedTranche)
      const valid = await verifyMsg(keys.publicKey, msg, sig.sigBuf)
      if (!valid) {
        setPhase('invalid')
        setShakeKey(k => k + 1)
      } else {
        setPhase('valid')
      }
    } catch (e) {
      console.error(e)
      setPhase('idle')
    }
  }, [keys, tamperedTranche, sig])

  const handleReset = () => {
    setEditAmount(tranche.amount)
    setPhase('idle')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>Step 4 of 4</div>
        <h2 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#d4e0ef',
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>Try to Tamper</h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
          color: '#7a8fb0', margin: 0, lineHeight: 1.6, maxWidth: 600,
        }}>
          An attacker intercepts the tranche and changes the amount. They use the same
          signature — but the original signature was created over a <em>different</em> message.
          Change the amount below and try to verify.
        </p>
      </div>

      {/* Tamper message card */}
      <div style={{ marginBottom: 12 }}>
        <TrancheMsgCard
          tranche={tamperedTranche}
          editable
          editAmount={editAmount}
          onEditAmount={(v) => { setEditAmount(v); setPhase('idle') }}
        />
      </div>

      {/* Tamper indicator */}
      <AnimatePresence>
        {isActuallyTampered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 14 }}
          >
            <div style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
              color: '#fbbf24',
            }}>
              ⚠ Amount has been tampered: <strong>{tranche.amount}</strong> → <strong>{editAmount}</strong>.
              The attacker is still presenting the original signature.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Original signature (they still use this) */}
      <div style={{ marginBottom: 20 }}>
        <HexCard
          label="Original Signature (attacker re-uses it)"
          value={sig.sigHex}
          icon="🪬"
          color="#f59e0b"
          note="This signature was created for the original amount. The attacker cannot generate a new valid signature without NBFC 2's private key."
        />
      </div>

      {/* Verify button + result */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <motion.button
          key={shakeKey}
          animate={shakeKey > 0 && phase === 'invalid' ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          onClick={handleVerify}
          disabled={phase === 'verifying'}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 28px', borderRadius: 11, border: 'none',
            background: phase === 'invalid'
              ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.12))'
              : 'linear-gradient(135deg, #3b8cff, #1d6fe8)',
            color: phase === 'invalid' ? '#f87171' : '#fff',
            borderColor: phase === 'invalid' ? 'rgba(239,68,68,0.4)' : 'transparent',
            borderWidth: phase === 'invalid' ? 1 : 0,
            borderStyle: 'solid',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700, fontSize: '0.92rem',
            cursor: phase === 'verifying' ? 'wait' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {phase === 'verifying' ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⚙</motion.span> Verifying…</>
          ) : (
            <><span>🔍</span> Verify (Tampered Message + Original Signature)</>
          )}
        </motion.button>

        {phase !== 'idle' && phase !== 'verifying' && (
          <button
            onClick={handleReset}
            style={{
              padding: '13px 18px', borderRadius: 11,
              background: 'transparent',
              border: '1px solid rgba(59,140,255,0.2)',
              color: '#7a8fb0', fontFamily: 'Manrope, sans-serif',
              fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer',
            }}
          >Reset amount</button>
        )}
      </div>

      {/* Result panels */}
      <AnimatePresence mode="wait">
        {phase === 'invalid' && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              padding: '28px 32px', borderRadius: 14,
              background: 'rgba(239,68,68,0.09)',
              border: '2px solid rgba(239,68,68,0.45)',
              boxShadow: '0 0 48px rgba(239,68,68,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
              <motion.div
                initial={{ scale: 0, rotate: 30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 20 }}
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.15)',
                  border: '2.5px solid #ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 24px rgba(239,68,68,0.35)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </motion.div>
              <div>
                <div style={{
                  fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                  fontSize: '1.3rem', color: '#ef4444', marginBottom: 4,
                }}>✗ Signature Invalid</div>
                <div style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem',
                  color: '#ef444490',
                }}>Message does not match what was signed by NBFC 2</div>
              </div>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 700,
                fontSize: '0.82rem', color: '#f87171', marginBottom: 4,
              }}>Why this happened:</div>
              {[
                'The signature is cryptographically bound to the exact message that was signed — including the original amount.',
                'Changing even one character (₹18,000 → any other amount) produces a completely different message hash.',
                'The ECDSA verification algorithm rejects the signature because the message hash no longer matches.',
                'To forge a valid signature for the new amount, the attacker would need NBFC 2\'s private key — which was never shared.',
              ].map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                    color: '#9badc8', lineHeight: 1.55,
                  }}>{point}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'valid' && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '20px 24px', borderRadius: 12,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.3)',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem',
              color: '#34d399',
            }}
          >
            ✓ Signature valid — you didn't change the amount (or changed it back to the original).
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course connection */}
      <AnimatePresence>
        {phase === 'invalid' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              marginTop: 20, padding: '16px 20px', borderRadius: 10,
              background: 'rgba(59,140,255,0.05)',
              border: '1px solid rgba(59,140,255,0.15)',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
              color: '#7a8fb0', lineHeight: 1.65,
            }}
          >
            🎓 <strong style={{ color: '#6aaeff' }}>Course link:</strong> This is <strong style={{ color: '#b8c9df' }}>Layer 1 protection</strong> —
            the digital wax seal. Even before we check the hash chain (Layer 2), the signature
            already catches the fraud. In TrancheChain, every disbursement block carries
            both layers simultaneously.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

// TRANCHE is now derived from latestBlock props

export default function SignaturesTab({ latestBlock }) {
  const [activeStep, setActiveStep] = useState(1)
  const [keys,  setKeys]  = useState(null)
  const [sig,   setSig]   = useState(null)

  return (
    <div style={{ minHeight: '100vh', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Page header */}
        

        {/* Progress bar */}
        <ProgressBar activeStep={activeStep} />

        {/* Step panel */}
        <div className="glass-card" style={{ padding: '32px 28px', minHeight: 400 }}>
          <AnimatePresence mode="wait">
            {activeStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Step1 onComplete={(k) => { setKeys(k); setActiveStep(2) }} />
              </motion.div>
            )}
            {activeStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Step2 keys={keys} tranche={latestBlock || {}} onComplete={(s) => { setSig(s); setActiveStep(3) }} />
              </motion.div>
            )}
            {activeStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Step3 keys={keys} tranche={latestBlock || {}} sig={sig} onComplete={() => setActiveStep(4)} />
              </motion.div>
            )}
            {activeStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Step4 keys={keys} tranche={latestBlock || {}} sig={sig} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav actions */}
        {activeStep > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(59,140,255,0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveStep(s => s - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(59,140,255,0.25)',
                color: '#7a8fb0', fontFamily: 'Manrope, sans-serif',
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back to Step {activeStep - 1}
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239,68,68,0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setKeys(null);
                setSig(null);
                setActiveStep(1);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', fontFamily: 'Manrope, sans-serif',
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset Tutorial
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
