import { motion } from 'framer-motion'

export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 80px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '52px' }}
      >
        <span className="badge badge-blue" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          📋 Project Info
        </span>
        <h1 style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          letterSpacing: '-0.02em',
          margin: '0 0 14px',
          color: '#d4e0ef',
        }}>
          About TrancheChain
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card"
        style={{ padding: '36px 32px', marginBottom: '20px' }}
      >
        <h2 style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: '#d4e0ef',
          margin: '0 0 14px',
        }}>
          Course Context
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9rem',
          color: '#7a8fb0',
          lineHeight: 1.7,
          margin: 0,
        }}>
          TrancheChain is a PGDM Fintech course prototype — an original interactive demo
          inspired by GrayQuest-style education finance platforms. It was built to demonstrate
          blockchain primitives (hash chains, digital signatures, decentralised consensus)
          using the exact analogies taught in the course: hashes as fingerprints, the chain
          as a public ledger book, decentralisation as a village council, and signatures as
          wax seals. Every UI label and tooltip maps back to the professor's course material.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card"
        style={{ padding: '36px 32px', marginBottom: '20px' }}
      >
        <h2 style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: '#d4e0ef',
          margin: '0 0 14px',
        }}>
          Tech Stack
        </h2>
        {[
          ['React + Vite', 'UI framework and build tool'],
          ['Tailwind CSS', 'Utility-first styling'],
          ['Framer Motion', 'Page and state transitions'],
          ['React Router', 'Client-side routing'],
          ['Recharts', 'Data visualisations'],
          ['crypto-js / Custom SHA-256', 'Real hash computation — no mocks'],
        ].map(([name, desc]) => (
          <div key={name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid rgba(59,140,255,0.07)',
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.82rem',
              color: '#6aaeff',
            }}>{name}</span>
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.82rem',
              color: '#7a8fb0',
            }}>{desc}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card"
        style={{ padding: '28px 32px' }}
      >
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          color: '#243352',
          lineHeight: 1.6,
          margin: 0,
          textAlign: 'center',
        }}>
          ⚠ This is an original prototype for educational purposes only.
          Not affiliated with or endorsed by GrayQuest Financial Services.
          No real financial data or transactions.
        </p>
      </motion.div>
    </div>
  )
}
