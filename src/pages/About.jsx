import { motion } from 'framer-motion'
import { ClipboardList, AlertTriangle } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

export default function About() {
  const isMobile = useIsMobile();
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '40px 16px 60px' : '64px 24px 80px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '52px' }}
      >
        <span className="badge badge-blue" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ClipboardList size={14} /> Project Info
        </span>
        <h1 style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          letterSpacing: '-0.02em',
          margin: '0 0 14px',
          color: 'var(--text-primary)',
        }}>
          About TrancheChain
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card"
        style={{ padding: isMobile ? '24px 20px' : '36px 32px', marginBottom: '20px' }}
      >
        <h2 style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--text-primary)',
          margin: '0 0 14px',
        }}>
          Course Context
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          margin: 0,
        }}>
          TrancheChain is an advanced prototype developed as a capstone project for the PGDM Fintech curriculum. Designed to demystify complex blockchain primitives, this interactive platform simulates a multi-party education finance ecosystem. It translates abstract cryptographic concepts into intuitive, real-world analogies taught in the classroom: cryptographic hashes serve as unforgeable fingerprints, the blockchain functions as an immutable public ledger, decentralized nodes act as a consensus-driven village council, and digital signatures provide the security of tamper-proof wax seals. Every interactive element has been meticulously crafted to bridge the gap between theoretical coursework and practical, real-world fintech applications.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card"
        style={{ padding: isMobile ? '24px 20px' : '36px 32px', marginBottom: '20px' }}
      >
        <h2 style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--text-primary)',
          margin: '0 0 14px',
        }}>
          Team Members
        </h2>
        {[
          'LIASH ROY',
          'GOGISETTI NAGA VENKATA SAI CHAITANYA',
          'ASHWINI BOTHRA',
          'SAMBHAV JAIN',
          'NITYAM ABICHANDANI'
        ].map((name) => (
          <div key={name} style={{
            padding: '12px 0',
            borderBottom: '1px solid rgba(59,140,255,0.07)',
          }}>
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}>{name}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card"
        style={{ padding: isMobile ? '20px 20px' : '28px 32px' }}
      >
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          color: '#243352',
          lineHeight: 1.6,
          margin: 0,
          textAlign: 'center',
        }}>
          <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px', marginTop: '-2px' }} />
          This is an original prototype for educational purposes only.
          Not affiliated with or endorsed by Fintech Company Financial Services.
          No real financial data or transactions.
        </p>
      </motion.div>
    </div>
  )
}
