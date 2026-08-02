import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
}

export default function Layout() {
  const location = useLocation()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B1220',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glows */}
      <div style={{
        position: 'fixed',
        top: '-20vh',
        left: '-10vw',
        width: '60vw',
        height: '60vh',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,140,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-15vh',
        right: '-10vw',
        width: '50vw',
        height: '50vh',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Grid overlay */}
      <div className="bg-grid" style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <Navbar />

      {/* Page content with animated transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: '64px',
            minHeight: '100vh',
          }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(59,140,255,0.08)',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.78rem',
          color: '#7a8fb0',
        }}>
          TrancheChain — PGDM Fintech Course Prototype · Not a real financial product
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          color: '#243352',
        }}>
          Fintech Company-style education finance platform
        </span>
      </footer>
    </div>
  )
}
