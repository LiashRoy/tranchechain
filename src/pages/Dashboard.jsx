import { Globe, Smartphone, Monitor, Building2, Link as LinkIcon, Radio, CheckCircle2, AlertTriangle, XCircle, Settings, PenTool, Flame, Hammer, ShieldAlert, ShieldCheck, Clapperboard, ClipboardList, Key, Lock, Unlock, Fingerprint, Search, GraduationCap, Zap, Pencil, Landmark, BookOpen } from "lucide-react"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import CryptoJS from 'crypto-js'
import PhoneFrame from '../components/PhoneFrame'
import { useGlobalChain } from '../context/GlobalChainContext'
import { useIsMobile } from '../hooks/useIsMobile'

/* ═══════════════════════════════════════════════════════════════════════════
   CHAIN DATA
═══════════════════════════════════════════════════════════════════════════ */
const sha256 = (s) => CryptoJS.SHA256(s).toString()
const GENESIS = '0'.repeat(64)
const bStr = ({ from, to, amount, milestone, timestamp, prevHash }) =>
  `EDU-2024-001||${from}||${to}||${amount}||${milestone}||${timestamp}||${prevHash}`
const computeHash = (b) => sha256(bStr(b))
const trunc = (h = '', n = 10) => `${h.slice(0, n)}…`

const ENTITY_INITIALS = { 'NBFC 1': 'N1', 'NBFC 2': 'N2', 'NBFC 3': 'N3', 'Partner Institute': 'PI' }
const ENTITY_COLORS = { 'NBFC 1': 'var(--color-electric-blue)', 'NBFC 2': 'var(--color-teal)', 'NBFC 3': '#a78bfa', 'Partner Institute': 'var(--color-green)' }

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK EXPLORER MODAL
═══════════════════════════════════════════════════════════════════════════ */
function BlockModal({ block, onClose, accentColor = 'var(--color-electric-blue)' }) {
  if (!block) return null;
  const statusColor = block.status === 'tampered' ? 'var(--color-gold)' : block.status === 'invalid' ? 'var(--color-red)' : 'var(--color-green)';
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          background: 'var(--bg-body)', border: `1px solid ${accentColor}40`,
          borderRadius: 16, padding: '24px', width: '100%', maxWidth: 500,
          boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}10`,
          position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
          padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><XCircle size={20} /></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: statusColor,
          }}>
            {block.status === 'valid' ? <CheckCircle2 size={20} /> : block.status === 'tampered' ? <AlertTriangle size={20} /> : <XCircle size={20} />}
          </div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.50rem', color: 'var(--text-primary)' }}>Block #{block.index}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.00rem', color: statusColor }}>{block.status.toUpperCase()}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 8, border: '1px solid #1e293b' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem', color: 'var(--text-secondary)', marginBottom: 4 }}>TRANSACTION</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.13rem', color: 'var(--text-primary)' }}>{block.from} → {block.to}</div>
          </div>
          <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 8, border: '1px solid #1e293b' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem', color: 'var(--text-secondary)', marginBottom: 4 }}>AMOUNT</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.38rem', color: statusColor }}>{block.amount}</div>
          </div>
          <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 8, border: '1px solid #1e293b' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem', color: 'var(--text-secondary)', marginBottom: 4 }}>TIMESTAMP</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.13rem', color: 'var(--text-primary)' }}>{block.timestamp}</div>
          </div>
          <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 8, border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem', color: 'var(--text-secondary)', marginBottom: 4 }}>BLOCK HASH (SHA-256)</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.94rem', color: 'var(--color-teal)', wordBreak: 'break-all' }}>{block.hash || 'Pending Computation...'}</div>
          </div>
          {block.prevHash && (
            <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 8, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.81rem', color: 'var(--text-secondary)', marginBottom: 4 }}>PREVIOUS HASH</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.94rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{block.prevHash}</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PORTAL BLOCK
═══════════════════════════════════════════════════════════════════════════ */
function PortalBlock({ block, accentColor, style = {}, onClick }) {
  const statusColor =
    block.status === 'tampered' ? 'var(--color-gold)' :
    block.status === 'invalid'  ? 'var(--color-red)' :
    block.status === 'pending'  ? 'var(--color-electric-blue)' : 'var(--color-green)'

  const bg =
    block.status === 'tampered' ? 'rgba(245,158,11,0.07)' :
    block.status === 'invalid'  ? 'rgba(239,68,68,0.07)'  :
    block.status === 'pending'  ? 'rgba(59,140,255,0.07)' : 'var(--glass-bg)'

  const border =
    block.status === 'tampered' ? 'rgba(245,158,11,0.35)' :
    block.status === 'invalid'  ? 'rgba(239,68,68,0.35)'  :
    block.status === 'pending'  ? 'rgba(59,140,255,0.35)' : `${accentColor}20`

  return (
    <motion.div
      onClick={() => onClick && onClick(block)}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      animate={block.status !== 'valid' ? {
        boxShadow: [`0 0 0px ${statusColor}00`, `0 0 16px ${statusColor}40`, `0 0 8px ${statusColor}20`],
      } : { boxShadow: 'none' }}
      transition={{ duration: 0.6 }}
      style={{
        borderRadius: 10, overflow: 'hidden',
        border: `1.5px solid ${border}`,
        background: bg,
        transition: 'border-color 0.4s, background 0.4s',
        transform: 'translateZ(0)',
        willChange: 'transform, box-shadow',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
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
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            #{block.index}
          </span>
        </div>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.75rem',
          color: statusColor,
        }}>
          {block.status === 'valid' ? <><CheckCircle2 size={16} /> Valid</> : 
           block.status === 'pending' ? <><AlertTriangle size={16} /> Pending</> :
           block.status === 'tampered' ? <><AlertTriangle size={16} /> Tampered</> : 
           <><XCircle size={16} /> Invalid</>}
        </span>
      </div>

      <div style={{ padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {[block.from, block.to].map((e, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {i === 1 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.81rem' }}>→</span>}
              <span style={{
                padding: '1px 5px', borderRadius: 4,
                background: `${ENTITY_COLORS[e] || accentColor}15`,
                border: `1px solid ${ENTITY_COLORS[e] || accentColor}30`,
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.69rem',
                color: ENTITY_COLORS[e] || accentColor,
              }}>{ENTITY_INITIALS[e] || e.slice(0, 2)}</span>
            </span>
          ))}
        </div>

        <motion.div
          key={block.amount}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
            fontSize: '1.31rem',
            color: block.status === 'tampered' ? '#fbbf24' :
                   block.status === 'invalid'  ? '#f87171' : 
                   block.status === 'pending'  ? '#6aaeff' : 'var(--color-green)',
            letterSpacing: '-0.01em',
          }}
        >{block.amount}</motion.div>

        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', color: '#a78bfa' }}>
          {block.milestone}
        </div>

        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 5 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.69rem', color: '#14b8a690' }}>
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
function BrowserFrame({ url, accentColor, isConsensus, children }) {
  return (
    <motion.div
      animate={{
        boxShadow: `0 0 24px ${accentColor}25`
      }}
      transition={{ duration: 0.7 }}
      style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid rgba(255,255,255,0.07)`,
        background: 'var(--bg-body)',
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        background: 'var(--bg-body)',
        padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {['var(--color-red)', 'var(--color-gold)', 'var(--color-green)'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.85 }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: 'var(--bg-body)', borderRadius: 6,
          padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
          border: '1px solid rgba(255,255,255,0.05)', minWidth: 0,
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{url}</span>
        </div>
      </div>
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
   NODE CONTENTS
═══════════════════════════════════════════════════════════════════════════ */
function NBFCContent({ chain, onBlockClick, step, setStep, pendingBlock }) {
  const accentColor = 'var(--color-electric-blue)'
  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'var(--glass-border)',
        border: '1px solid rgba(59,140,255,0.18)',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'var(--nav-border)', border: '1px solid rgba(59,140,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
          fontSize: '0.88rem', color: accentColor, flexShrink: 0,
        }}>AF</div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.31rem', color: 'var(--text-primary)' }}>
            NBFC 3
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.94rem', color: 'var(--text-secondary)' }}>
            Disbursement Console
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            fontFamily: 'Manrope, sans-serif', fontWeight: 800,
            fontSize: '0.75rem', color: '#34d399',
          }}><CheckCircle2 size={16} /> SYNCED</div>
        </div>
      </div>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)',
        marginBottom: 4,
      }}>LOAN: EDU-2024-001 · 3 tranches</div>

      {chain.map(block => (
        <PortalBlock key={block.index} block={block} accentColor={accentColor} onClick={onBlockClick} />
      ))}
      
      {/* APPROVAL WORKFLOW INJECTION */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 10, padding: 12, borderRadius: 10,
              background: 'rgba(59,140,255,0.1)', border: '1px dashed rgba(59,140,255,0.4)',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.94rem', color: '#6aaeff', fontWeight: 800 }}>
                Pending Disbursement (Semester 3)
              </div>
              <PortalBlock block={pendingBlock} accentColor={accentColor} />
              <button 
                onClick={() => setStep(1)}
                style={{
                  padding: '8px 16px', borderRadius: 8, background: 'var(--color-electric-blue)', color: '#ffffff',
                  border: 'none', fontFamily: 'Manrope, sans-serif', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                <PenTool size={16} /> Approve & Sign Transaction
              </button>
            </div>
          </motion.div>
        )}
        {step > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PortalBlock block={{...pendingBlock, status: 'valid', hash: computeHash({...pendingBlock, amount: '₹24,000'})}} accentColor={accentColor} onClick={onBlockClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FintechCompanyContent({ chain, onBlockClick, step, pendingBlock }) {
  const accentColor = 'var(--color-gold)'
  return (
    <div style={{ padding: '0 10px 10px' }}>
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
          fontSize: '1.00rem', flexShrink: 0,
        }}><LinkIcon size={16} /></div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.31rem', color: '#fbbf24' }}>
            Fintech Company
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.94rem', color: 'var(--text-secondary)' }}>
            Education Finance
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chain.map(block => (
          <motion.div key={block.index} onClick={() => onBlockClick && onBlockClick(block)} whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }} style={{ cursor: "pointer", 
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
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                color: 'var(--color-gold)', fontWeight: 800,
              }}>{block.milestone}</span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.78rem',
                color: 'var(--color-green)',
              }}><CheckCircle2 size={16} /></span>
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                  fontSize: '1.15rem', color: 'var(--color-green)',
                }}>{block.amount}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.69rem', color: 'var(--text-secondary)' }}>
                  {block.from} → PI
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                  color: '#14b8a650',
                }}>{trunc(block.hash, 8)}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {block.timestamp.split(' ')[0]}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* NEW BLOCK */}
        {step >= 1 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => onBlockClick && onBlockClick({...pendingBlock, status: step === 2 ? 'valid' : 'pending', hash: step === 2 ? computeHash({...pendingBlock, amount: '₹24,000'}) : ''})} whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }} style={{ cursor: "pointer", 
            borderRadius: 10,
            background: step === 2 ? 'rgba(245,158,11,0.05)' : 'rgba(59,140,255,0.1)',
            border: step === 2 ? '1px solid rgba(245,158,11,0.12)' : '1px dashed rgba(59,140,255,0.4)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 10px',
              borderBottom: step === 2 ? '1px solid rgba(245,158,11,0.08)' : '1px solid rgba(59,140,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                color: step === 2 ? 'var(--color-gold)' : 'var(--color-electric-blue)', fontWeight: 800,
              }}>{pendingBlock.milestone}</span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.78rem',
                color: step === 2 ? 'var(--color-green)' : 'var(--color-electric-blue)',
              }}>{step === 2 ? <CheckCircle2 size={16} /> : "Awaiting Inst..."}</span>
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                  fontSize: '1.15rem', color: step === 2 ? 'var(--color-green)' : 'var(--color-electric-blue)',
                }}>{pendingBlock.amount}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.69rem', color: 'var(--text-secondary)' }}>
                  {pendingBlock.from} → PI
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                  color: '#14b8a650',
                }}>{step === 2 ? trunc(computeHash({...pendingBlock, amount: '₹24,000'}), 8) : 'PENDING'}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {pendingBlock.timestamp.split(' ')[0]}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div style={{
        marginTop: 10, padding: '8px 10px', borderRadius: 9,
        background: 'rgba(20,184,166,0.08)',
        border: '1px solid rgba(20,184,166,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 6px #10b98180' }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#34d399' }}>
          All nodes in consensus
        </span>
      </div>
    </div>
  )
}

function InstitutionContent({ chain, onBlockClick, step, setStep, pendingBlock }) {
  const accentColor = '#a78bfa'
  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          fontSize: '1.25rem', flexShrink: 0,
        }}><Building2 size={16} /></div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.31rem', color: 'var(--text-primary)' }}>
            Partner Institute
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.94rem', color: 'var(--text-secondary)' }}>
            Finance Office Portal
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            fontFamily: 'Manrope, sans-serif', fontWeight: 800,
            fontSize: '0.75rem', color: '#34d399',
          }}><CheckCircle2 size={16} /> VERIFIED</div>
        </div>
      </div>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)',
        marginBottom: 4,
      }}>STUDENT LOAN: EDU-2024-001 · ₹66,000 total</div>

      {chain.map(block => (
        <PortalBlock key={block.index} block={block} accentColor={accentColor} onClick={onBlockClick} />
      ))}
      
      {/* APPROVAL WORKFLOW INJECTION */}
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 10, padding: 12, borderRadius: 10,
              background: 'rgba(167,139,250,0.1)', border: '1px dashed rgba(167,139,250,0.4)',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.94rem', color: '#c4b5fd', fontWeight: 800 }}>
                Incoming Transfer Detected (Unverified)
              </div>
              <PortalBlock block={pendingBlock} accentColor={accentColor} />
              <button 
                onClick={() => setStep(2)}
                style={{
                  padding: '8px 16px', borderRadius: 8, background: '#a78bfa', color: 'var(--bg-body)',
                  border: 'none', fontFamily: 'Manrope, sans-serif', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                <CheckCircle2 size={16} /> Acknowledge Receipt & Verify
              </button>
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PortalBlock block={{...pendingBlock, status: 'valid', hash: computeHash({...pendingBlock, amount: '₹24,000'})}} accentColor={accentColor} onClick={onBlockClick} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        padding: '10px 12px', borderRadius: 9,
        background: 'rgba(167,139,250,0.07)',
        border: '1px solid rgba(167,139,250,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.90rem', color: 'var(--text-secondary)' }}>
          Total received
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
          fontSize: '1.13rem', color: '#c4b5fd',
        }}>₹{42000 + (step === 2 ? 24000 : 0)}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { demoBlocks: CLEAN_CHAIN } = useGlobalChain()
  const [selectedBlock, setSelectedBlock] = useState(null)
  
  // 0: Not started (NBFC must click approve)
  // 1: NBFC approved, propagating (Institute must click acknowledge)
  // 2: Finalized
  const [transactionStep, setTransactionStep] = useState(0)

  const pendingBlock = {
    index: 4,
    from: 'NBFC 3',
    to: 'Partner Institute',
    amount: '₹24,000',
    milestone: 'Semester 3 Start',
    timestamp: '2025-08-10 10:00',
    prevHash: CLEAN_CHAIN[2]?.hash || '',
    status: 'pending',
    hash: ''
  }

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? '16px 12px 60px' : '28px 20px 60px' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: 14, display: 'inline-flex' }}>
              <Globe size={16} /> Multi-Node Ledger View
            </span>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 10px' }}>
              Three Nodes · One Truth
            </h1>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.13rem', color: 'var(--text-secondary)', margin: 0, maxWidth: 560, lineHeight: 1.65 }}>
              NBFC, Fintech Company, and Institution each hold an independent, identical copy of the ledger. Show a live transaction propagating across the network.
            </p>
          </div>
          <div>
            <button onClick={() => setTransactionStep(0)} style={{
              padding: '10px 20px', borderRadius: 8, background: 'var(--glass-border)', color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Manrope, sans-serif', fontWeight: 800, cursor: 'pointer',
            }}>
              RESET DASHBOARD
            </button>
          </div>
        </motion.div>

        {/* SIDE-BY-SIDE VIEW */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'flex-start',
          overflowX: 'auto', paddingBottom: 8, marginBottom: 28,
        }}>
          {/* NBFC Portal */}
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--color-electric-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>💻 NBFC Node</span>
            </div>
            <BrowserFrame url="nbfc.tranchechain.fi/console" accentColor="var(--color-electric-blue)">
              <NBFCContent chain={CLEAN_CHAIN} onBlockClick={setSelectedBlock} step={transactionStep} setStep={setTransactionStep} pendingBlock={pendingBlock} />
            </BrowserFrame>
          </div>

          {/* Fintech App */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
             <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📱 Fintech Node</span>
            </div>
            <PhoneFrame accentColor="var(--color-gold)">
              <FintechCompanyContent chain={CLEAN_CHAIN} onBlockClick={setSelectedBlock} step={transactionStep} pendingBlock={pendingBlock} />
            </PhoneFrame>
          </div>

          {/* Institution Portal */}
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>💻 Institution Node</span>
            </div>
            <BrowserFrame url="narayana.tranchechain.fi/finance" accentColor="#a78bfa">
              <InstitutionContent chain={CLEAN_CHAIN} onBlockClick={setSelectedBlock} step={transactionStep} setStep={setTransactionStep} pendingBlock={pendingBlock} />
            </BrowserFrame>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{
          marginTop: 24, padding: '18px 22px', borderRadius: 12, background: 'rgba(59,140,255,0.04)', border: '1px solid rgba(59,140,255,0.12)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16,
        }}>
          {[
            { icon: <Landmark size={18} color="var(--text-secondary)" />,  title: 'Village Council',  text: 'No single node has the authority to alter the ledger. The majority decides what is true — exactly like a village council.' },
            { icon: <BookOpen size={18} color="var(--text-secondary)" />, title: 'Wikipedia Analogy', text: 'Anyone can read the ledger. You trust the cryptographic proof, not the institution presenting it.' },
            { icon: <Settings size={18} color="var(--text-secondary)" />,  title: 'Node vs Transactor', text: 'NBFC, Fintech Company, and Institution are nodes — they hold full ledger copies. The student is a transactor — they only need a wallet address.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: '1.50rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.00rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.text}</div>
              </div>
            </div>
          ))}
        </motion.div>

        <AnimatePresence>
          {selectedBlock && <BlockModal block={selectedBlock} onClose={() => setSelectedBlock(null)} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
