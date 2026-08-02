import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import CryptoJS from 'crypto-js'
import PhoneFrame from '../components/PhoneFrame'

/* ═══════════════════════════════════════════════════════════════════════════
   CHAIN DATA (real SHA-256, same schema as /ledger)
═══════════════════════════════════════════════════════════════════════════ */

const sha256 = (s) => CryptoJS.SHA256(s).toString()
const GENESIS = '0'.repeat(64)
const bStr = ({ from, to, amount, milestone, timestamp, prevHash }) =>
  `EDU-2024-001||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`
const computeHash = (b) => sha256(bStr(b))
const trunc = (h = '', n = 10) => `${h.slice(0, n)}…`

function makeBlock(data, prevHash) {
  const b = { ...data, prevHash }
  return { ...b, hash: computeHash(b), status: 'valid' }
}

const B1 = makeBlock({ from: 'Mirae Asset',   to: 'Narayana School', amount: '₹18,000', milestone: 'Admission Confirmed', timestamp: '2024-06-01 09:14', index: 1 }, GENESIS)
const B2 = makeBlock({ from: 'Arka Fincap',   to: 'Narayana School', amount: '₹24,000', milestone: 'Semester 1 Start',    timestamp: '2024-10-02 11:22', index: 2 }, B1.hash)
const B3 = makeBlock({ from: 'Ratnaafin Lite',to: 'Narayana School', amount: '₹24,000', milestone: 'Semester 2 Start',    timestamp: '2025-02-01 08:45', index: 3 }, B2.hash)

const CLEAN_CHAIN = [B1, B2, B3]

// Tampered version (only shown at NBFC node)
const B2_TAMPERED = { ...B2, amount: '₹75,000', status: 'tampered' }
const NBFC_TAMPERED_CHAIN = [B1, B2_TAMPERED, { ...B3, status: 'invalid' }]

/* ═══════════════════════════════════════════════════════════════════════════
   ENTITY META
═══════════════════════════════════════════════════════════════════════════ */

const ENTITY_INITIALS = {
  'Mirae Asset': 'MA', 'Arka Fincap': 'AF', 'Ratnaafin Lite': 'RL',
  'Narayana School': 'NS',
}
const ENTITY_COLORS = {
  'Mirae Asset': '#3b8cff', 'Arka Fincap': '#14b8a6',
  'Ratnaafin Lite': '#a78bfa', 'Narayana School': '#10b981',
}

/* ═══════════════════════════════════════════════════════════════════════════
   PORTAL BLOCK (compact, fits inside small device frames)
═══════════════════════════════════════════════════════════════════════════ */

function PortalBlock({ block, accentColor, style = {} }) {
  const statusColor =
    block.status === 'tampered' ? '#f59e0b' :
    block.status === 'invalid'  ? '#ef4444' : '#10b981'

  const bg =
    block.status === 'tampered' ? 'rgba(245,158,11,0.07)' :
    block.status === 'invalid'  ? 'rgba(239,68,68,0.07)'  : 'rgba(15,26,46,0.5)'

  const border =
    block.status === 'tampered' ? 'rgba(245,158,11,0.35)' :
    block.status === 'invalid'  ? 'rgba(239,68,68,0.35)'  : `${accentColor}20`

  return (
    <motion.div
      layout
      animate={block.status !== 'valid' ? {
        boxShadow: [`0 0 0px ${statusColor}00`, `0 0 16px ${statusColor}40`, `0 0 8px ${statusColor}20`],
      } : { boxShadow: 'none' }}
      transition={{ duration: 0.6 }}
      style={{
        borderRadius: 10, overflow: 'hidden',
        border: `1.5px solid ${border}`,
        background: bg,
        transition: 'border-color 0.4s, background 0.4s',
        ...style,
      }}
    >
      {/* Header row */}
      <div style={{
        padding: '7px 11px',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.div
            animate={{ background: statusColor }}
            transition={{ duration: 0.4 }}
            style={{ width: 6, height: 6, borderRadius: '50%', boxShadow: `0 0 5px ${statusColor}80` }}
          />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#7a8fb0' }}>
            #{block.index}
          </span>
        </div>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.6rem',
          color: statusColor,
        }}>
          {block.status === 'valid' ? '✓ Valid' : block.status === 'tampered' ? '⚠ Tampered' : '✗ Invalid'}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* From → To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {[block.from, block.to].map((e, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {i === 1 && <span style={{ color: '#243352', fontSize: '0.65rem' }}>→</span>}
              <span style={{
                padding: '1px 5px', borderRadius: 4,
                background: `${ENTITY_COLORS[e] || accentColor}15`,
                border: `1px solid ${ENTITY_COLORS[e] || accentColor}30`,
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                color: ENTITY_COLORS[e] || accentColor,
              }}>{ENTITY_INITIALS[e] || e.slice(0, 2)}</span>
            </span>
          ))}
        </div>

        {/* Amount */}
        <motion.div
          key={block.amount}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
            fontSize: '1.05rem',
            color: block.status === 'tampered' ? '#fbbf24' :
                   block.status === 'invalid'  ? '#f87171' : '#10b981',
            letterSpacing: '-0.01em',
          }}
        >{block.amount}</motion.div>

        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.62rem', color: '#a78bfa' }}>
          {block.milestone}
        </div>

        {/* Hash row */}
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 5 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#14b8a690' }}>
            hash: {trunc(block.hash)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BROWSER WINDOW FRAME
═══════════════════════════════════════════════════════════════════════════ */

function BrowserFrame({ url, title, accentColor, isConsensus, children }) {
  return (
    <motion.div
      animate={isConsensus ? {
        boxShadow: [`0 0 0px ${accentColor}00`, `0 0 32px ${accentColor}35`, `0 0 16px ${accentColor}15`],
      } : {
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}
      transition={{ duration: 0.7 }}
      style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid rgba(255,255,255,0.07)`,
        background: '#08101d',
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Title bar */}
      <div style={{
        background: '#10192c',
        padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {['#ef4444', '#f59e0b', '#10b981'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.85 }} />
          ))}
        </div>
        {/* URL bar */}
        <div style={{
          flex: 1, background: '#080f1c', borderRadius: 6,
          padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
          border: '1px solid rgba(255,255,255,0.05)', minWidth: 0,
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#7a8fb0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{url}</span>
        </div>
      </div>

      {/* Content (scrollable) */}
      <div style={{
        flex: 1, overflowY: 'auto', maxHeight: 460,
        scrollbarWidth: 'thin',
      }}>
        {children}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   NBFC PORTAL CONTENT (browser frame 1)
═══════════════════════════════════════════════════════════════════════════ */

function NBFCContent({ chain, tampered }) {
  const accentColor = '#3b8cff'
  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Portal header */}
      <div style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'rgba(59,140,255,0.08)',
        border: '1px solid rgba(59,140,255,0.18)',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'rgba(59,140,255,0.15)', border: '1px solid rgba(59,140,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          fontSize: '0.7rem', color: accentColor, flexShrink: 0,
        }}>AF</div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#d4e0ef' }}>
            Arka Fincap
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', color: '#7a8fb0' }}>
            Disbursement Console
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <AnimatePresence>
            {tampered ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '3px 8px', borderRadius: 999,
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  fontFamily: 'Manrope, sans-serif', fontWeight: 700,
                  fontSize: '0.6rem', color: '#fbbf24',
                }}
              >⚠ LOCAL EDIT</motion.div>
            ) : (
              <div style={{
                padding: '3px 8px', borderRadius: 999,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                fontFamily: 'Manrope, sans-serif', fontWeight: 700,
                fontSize: '0.6rem', color: '#34d399',
              }}>✓ SYNCED</div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#243352',
        marginBottom: 4,
      }}>LOAN: EDU-2024-001 · 3 tranches</div>

      {chain.map(block => (
        <PortalBlock key={block.index} block={block} accentColor={accentColor} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRAYQUEST APP CONTENT (phone frame)
═══════════════════════════════════════════════════════════════════════════ */

function GrayQuestContent({ chain }) {
  const accentColor = '#f59e0b'
  return (
    <div style={{ padding: '0 10px 10px' }}>
      {/* App header */}
      <div style={{
        padding: '8px 4px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(245,158,11,0.1)',
        marginBottom: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', flexShrink: 0,
        }}>⛓</div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.78rem', color: '#fbbf24' }}>
            GrayQuest
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.55rem', color: '#7a8fb0' }}>
            Education Finance
          </div>
        </div>
        {/* Notification bell */}
        <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a8fb0" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </div>

      <div style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.7rem',
        color: '#d4e0ef', marginBottom: 8, paddingLeft: 2,
      }}>
        Active Disbursements
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chain.map(block => (
          <div key={block.index} style={{
            borderRadius: 10,
            background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 10px',
              borderBottom: '1px solid rgba(245,158,11,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.6rem',
                color: '#f59e0b', fontWeight: 600,
              }}>{block.milestone}</span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.62rem',
                color: '#10b981',
              }}>✓</span>
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                  fontSize: '0.92rem', color: '#10b981',
                }}>{block.amount}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.55rem', color: '#7a8fb0' }}>
                  {block.from} → NS
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
                  color: '#14b8a650',
                }}>{trunc(block.hash, 8)}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.52rem', color: '#243352' }}>
                  {block.timestamp.split(' ')[0]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* App footer stat */}
      <div style={{
        marginTop: 10, padding: '8px 10px', borderRadius: 9,
        background: 'rgba(20,184,166,0.08)',
        border: '1px solid rgba(20,184,166,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b98180' }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6rem', color: '#34d399' }}>
          All nodes in consensus
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INSTITUTION PORTAL CONTENT (browser frame 3)
═══════════════════════════════════════════════════════════════════════════ */

function InstitutionContent({ chain }) {
  const accentColor = '#a78bfa'
  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Portal header */}
      <div style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'rgba(167,139,250,0.08)',
        border: '1px solid rgba(167,139,250,0.18)',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>🏫</div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#d4e0ef' }}>
            Narayana School
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', color: '#7a8fb0' }}>
            Finance Office Portal
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            fontFamily: 'Manrope, sans-serif', fontWeight: 700,
            fontSize: '0.6rem', color: '#34d399',
          }}>✓ VERIFIED</div>
        </div>
      </div>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#243352',
        marginBottom: 4,
      }}>STUDENT LOAN: EDU-2024-001 · ₹66,000 total</div>

      {chain.map(block => (
        <PortalBlock key={block.index} block={block} accentColor={accentColor} />
      ))}

      {/* Running total */}
      <div style={{
        padding: '10px 12px', borderRadius: 9,
        background: 'rgba(167,139,250,0.07)',
        border: '1px solid rgba(167,139,250,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.72rem', color: '#7a8fb0' }}>
          Total received
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
          fontSize: '0.9rem', color: '#c4b5fd',
        }}>₹66,000</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSENSUS VOTE PANEL
═══════════════════════════════════════════════════════════════════════════ */

function ConsensusPanel({ tampered }) {
  return (
    <AnimatePresence>
      {tampered && (
        <motion.div
          initial={{ opacity: 0, y: -16, scaleY: 0.85 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.06))',
            border: '2px solid rgba(239,68,68,0.4)',
            borderRadius: 14,
            boxShadow: '0 0 50px rgba(239,68,68,0.12)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <motion.span
              animate={{ rotate: [-3, 3, -3, 0] }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ fontSize: '1.6rem', lineHeight: 1 }}
            >⚠️</motion.span>
            <div>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800,
                fontSize: '1rem', color: '#f87171', marginBottom: 3,
              }}>Discrepancy Detected — Consensus Rejected</div>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#7a8fb0',
              }}>
                NBFC node's copy does not match network consensus.
                Majority (<strong style={{ color: '#fbbf24' }}>2 of 3 nodes</strong>) reject this version.
              </div>
            </div>
          </div>

          {/* Vote row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { node: '🏦 NBFC Node',        vote: 'DIVERGED', color: '#ef4444' },
              { node: '📱 GrayQuest Node',   vote: 'CONSENSUS', color: '#10b981' },
              { node: '🏫 Institution Node', vote: 'CONSENSUS', color: '#10b981' },
            ].map((n, i) => (
              <motion.div
                key={n.node}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12 }}
                style={{
                  flex: 1, minWidth: 140, padding: '10px 14px', borderRadius: 9,
                  background: `${n.color}10`,
                  border: `1.5px solid ${n.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem', color: '#9badc8' }}>
                  {n.node}
                </span>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.68rem',
                  color: n.color,
                }}>
                  {n.vote === 'DIVERGED' ? '✗ DIVERGED' : '✓ VALID'}
                </span>
              </motion.div>
            ))}
          </div>

          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 9,
            background: 'rgba(59,140,255,0.06)', border: '1px solid rgba(59,140,255,0.15)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: '#7a8fb0', lineHeight: 1.6,
          }}>
            🏛 <strong style={{ color: '#6aaeff' }}>This is decentralization in action.</strong>{' '}
            Like a village council — no single authority can rewrite the shared record.
            The honest majority always overrules a rogue node.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECHARTS — DISBURSEMENT TIMELINE
═══════════════════════════════════════════════════════════════════════════ */

const CHART_DATA = [
  { milestone: 'Admission', amount: 18000, nbfc: 'Mirae Asset',    color: '#3b8cff' },
  { milestone: 'Sem 1',     amount: 24000, nbfc: 'Arka Fincap',    color: '#14b8a6' },
  { milestone: 'Sem 2',     amount: 24000, nbfc: 'Ratnaafin Lite', color: '#a78bfa' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'rgba(15,26,46,0.95)', border: '1px solid rgba(59,140,255,0.25)',
      borderRadius: 10, padding: '12px 16px',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
    }}>
      <div style={{ color: '#d4e0ef', fontWeight: 700, marginBottom: 4 }}>{d?.milestone} Disbursement</div>
      <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>₹{d?.amount?.toLocaleString('en-IN')}</div>
      <div style={{ color: '#7a8fb0', marginTop: 2 }}>NBFC: {d?.nbfc}</div>
    </div>
  )
}

function DisbursementChart({ tampered }) {
  const data = tampered
    ? [...CHART_DATA.slice(0, 1), { ...CHART_DATA[1], amount: 75000 }, CHART_DATA[2]]
    : CHART_DATA

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 700,
        fontSize: '0.9rem', color: '#d4e0ef', marginBottom: 4,
      }}>
        📊 Disbursement Timeline — EDU-2024-001
      </div>
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem', color: '#7a8fb0', marginBottom: 20,
      }}>
        {tampered ? (
          <span style={{ color: '#f87171' }}>
            ⚠ NBFC node reports ₹75,000 for Semester 1 — other nodes show ₹24,000
          </span>
        ) : 'Tranche amounts across disbursement milestones · All 3 nodes in consensus'}
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,140,255,0.08)" vertical={false} />
            <XAxis
              dataKey="milestone"
              tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: '#7a8fb0' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: '#7a8fb0' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,140,255,0.05)' }} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={tampered && i === 1 ? '#ef4444' : entry.color}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {tampered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.76rem', color: '#f87171',
          }}
        >
          📊 Chart shows NBFC's tampered local value. Consensus value (from GrayQuest + Institution nodes): ₹24,000
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const [tampered, setTampered] = useState(false)

  return (
    <div style={{ minHeight: '100vh', padding: '28px 20px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28 }}
        >
          <span className="badge badge-teal" style={{ marginBottom: 14, display: 'inline-flex' }}>
            🌐 Multi-Node Ledger View
          </span>
          <h1 style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', letterSpacing: '-0.03em',
            color: '#d4e0ef', margin: '0 0 10px',
          }}>
            Three Nodes · One Truth
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#7a8fb0', margin: 0, maxWidth: 560, lineHeight: 1.65,
          }}>
            NBFC, GrayQuest Platform, and Institution each hold an independent, identical copy of the ledger.
            No single party controls the record — this is the village council principle.
          </p>
        </motion.div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: tampered ? 1 : 1.03, y: tampered ? 0 : -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setTampered(t => !t)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 24px', borderRadius: 11, border: 'none',
              background: tampered
                ? 'rgba(59,140,255,0.12)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: tampered ? '#6aaeff' : '#fff',
              borderColor: tampered ? 'rgba(59,140,255,0.3)' : 'transparent',
              borderWidth: tampered ? 1 : 0, borderStyle: 'solid',
              fontFamily: 'Manrope, sans-serif', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: tampered ? 'none' : '0 6px 24px rgba(239,68,68,0.3)',
              transition: 'all 0.3s',
            }}
          >
            {tampered ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Restore Consensus</>
            ) : (
              <><span style={{ fontSize: '1.1rem' }}>🔨</span> Simulate Tamper at NBFC Node Only</>
            )}
          </motion.button>

          {tampered && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 9,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', color: '#fbbf24' }}>
                NBFC node diverged — consensus active
              </span>
            </motion.div>
          )}
        </div>

        {/* Consensus rejection banner */}
        <ConsensusPanel tampered={tampered} />

        {/* THREE DEVICE FRAMES */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'flex-start',
          overflowX: 'auto', paddingBottom: 8, marginBottom: 28,
        }}>
          {/* ── NBFC Portal (Browser) ─────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#3b8cff',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>💻 NBFC Node</span>
            </div>
            <BrowserFrame
              url="nbfc.tranchechain.fi/console"
              accentColor="#3b8cff"
              isConsensus={!tampered}
            >
              <NBFCContent chain={tampered ? NBFC_TAMPERED_CHAIN : CLEAN_CHAIN} tampered={tampered} />
            </BrowserFrame>
          </div>

          {/* ── GrayQuest (Phone) ─────────────────────────────────── */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <PhoneFrame accentColor="#f59e0b" isConsensus={tampered}>
              <GrayQuestContent chain={CLEAN_CHAIN} />
            </PhoneFrame>
            {tampered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontFamily: 'Manrope, sans-serif', fontWeight: 700,
                  fontSize: '0.65rem', color: '#34d399',
                }}
              >✓ Voting: REJECT NBFC VERSION</motion.div>
            )}
          </div>

          {/* ── Institution Portal (Browser) ──────────────────────── */}
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#a78bfa',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>💻 Institution Node</span>
            </div>
            <BrowserFrame
              url="narayana.tranchechain.fi/finance"
              accentColor="#a78bfa"
              isConsensus={tampered}
            >
              <InstitutionContent chain={CLEAN_CHAIN} />
            </BrowserFrame>
          </div>
        </div>

        {/* RECHARTS — Disbursement bar chart */}
        <DisbursementChart tampered={tampered} />

        {/* Course link callout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 24, padding: '18px 22px', borderRadius: 12,
            background: 'rgba(59,140,255,0.04)',
            border: '1px solid rgba(59,140,255,0.12)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { icon: '🏛',  title: 'Village Council',  text: 'No single node has the authority to alter the ledger. The majority decides what is true — exactly like a village council.' },
            { icon: '📖', title: 'Wikipedia Analogy', text: 'Anyone can read the ledger. You trust the cryptographic proof, not the institution presenting it.' },
            { icon: '⚙',  title: 'Node vs Transactor', text: 'NBFC, GrayQuest, and Institution are nodes — they hold full ledger copies. The student is a transactor — they only need a wallet address.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#b8c9df', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', color: '#7a8fb0', lineHeight: 1.55 }}>{item.text}</div>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}
