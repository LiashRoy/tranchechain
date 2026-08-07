import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

const NAV_LINKS = [
  { to: '/',             label: 'Home',          short: 'Home' },
  { to: '/dashboard',    label: 'Dashboard',     short: 'Dashboard' },
  { to: '/how-it-works', label: 'How It Works',  short: 'Concepts' },
  { to: '/demo',         label: 'Live Demo',     short: 'Demo' },
  { to: '/about',        label: 'About',         short: 'About' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Add backdrop blur when scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -72 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: scrolled ? 'var(--nav-bg)' : 'transparent',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transform: 'translateZ(0)',
          willChange: 'transform, backdrop-filter',
          backfaceVisibility: 'hidden',
          borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid transparent',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* ── Logo ── */}
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          {/* Icon mark */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'var(--color-electric-blue)', // Professional blues
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(37,99,235,0.3)',
            flexShrink: 0,
          }}>
            {/* Chain link SVG icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Wordmark */}
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
            background: 'var(--text-primary)', // Slate
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            TrancheChain
          </span>
        </NavLink>

        {/* ── Desktop Nav Links ── */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '32px',
          flex: 1,
        }}
          className="desktop-nav"
        >
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                padding: '6px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                fontSize: '0.85rem',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--badge-blue-bg)' : 'transparent',
                border: isActive ? '1px solid var(--badge-blue-border)' : '1px solid transparent',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('0.12')) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'rgba(37,99,235,0.06)'
                }
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.color = '#94a3b8'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Right side: badge + mobile toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexShrink: 0 }}>

          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            style={{
              display: 'none',
              background: 'var(--glass-border)',
              border: '1px solid rgba(59,140,255,0.2)',
              borderRadius: '8px',
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 0,
            }}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </motion.header>

      {/* ── Mobile Dropdown Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              zIndex: 99,
              background: 'var(--nav-bg)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(59,140,255,0.14)',
              padding: '12px 16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                style={({ isActive }) => ({
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--badge-blue-bg)' : 'transparent',
                  display: 'block',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          .course-badge { display: none !important; }
        }
      `}</style>
    </>
  )
}
