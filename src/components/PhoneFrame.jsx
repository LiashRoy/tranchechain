import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function PhoneFrame({ accentColor = 'var(--color-gold)', isConsensus = false, label = 'Mobile App', autoScroll = true, children }) {
  const scrollRef = useRef(null)

  // Subtle auto-scroll to hint at scrollability
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 40, behavior: 'smooth' })
      setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 1000)
    }, 1200)
    return () => clearTimeout(t)
  }, [autoScroll])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      {/* Label above */}
      {label && (
        <div style={{ marginBottom: 10, textAlign: 'center' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: accentColor,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{label}</span>
        </div>
      )}

      {/* Phone shell */}
      <motion.div
        animate={isConsensus ? {
          boxShadow: [
            `0 0 0px ${accentColor}00`,
            `0 0 48px ${accentColor}50, 0 0 80px ${accentColor}20`,
            `0 0 32px ${accentColor}35`,
          ],
        } : {
          boxShadow: `0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px #0a0c12, 0 0 24px ${accentColor}10`,
        }}
        transition={{ duration: 0.8 }}
        style={{
          width: 240,
          height: 508,
          borderRadius: 46,
          background: 'linear-gradient(180deg, #111520 0%, #0c1018 100%)',
          border: '2px solid #1c2438',
          padding: '10px 8px',
          position: 'relative',
          outline: '1px solid #0a0c12',
        }}
      >
        {/* Power button — right */}
        <div style={{
          position: 'absolute', right: -4, top: '32%',
          width: 4, height: 42, borderRadius: '0 3px 3px 0',
          background: 'var(--bg-body)',
        }} />
        {/* Volume up — left */}
        <div style={{
          position: 'absolute', left: -4, top: '25%',
          width: 4, height: 28, borderRadius: '3px 0 0 3px',
          background: 'var(--bg-body)',
        }} />
        {/* Volume down — left */}
        <div style={{
          position: 'absolute', left: -4, top: '35%',
          width: 4, height: 28, borderRadius: '3px 0 0 3px',
          background: 'var(--bg-body)',
        }} />
        {/* Silent toggle — left */}
        <div style={{
          position: 'absolute', left: -4, top: '16%',
          width: 4, height: 16, borderRadius: '3px 0 0 3px',
          background: 'var(--bg-body)',
        }} />

        {/* Screen */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 38,
          background: 'var(--bg-body)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Dynamic island notch */}
          <div style={{
            position: 'absolute', top: 10, left: '50%',
            transform: 'translateX(-50%)',
            width: 88, height: 26, borderRadius: 14,
            background: 'var(--bg-body)',
            zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '0 14px',
          }}>
            {/* Camera */}
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-body)', border: '1px solid #1a2030' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-body)', margin: '1px auto' }} />
            </div>
            {/* Microphone dot */}
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--bg-body)' }} />
          </div>

          {/* Status bar */}
          <div style={{
            padding: '42px 16px 6px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: 'var(--text-primary)' }}>9:41</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Signal */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                {[5, 8, 11, 14].map((h, i) => (
                  <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < 3 ? 'var(--text-primary)' : 'var(--text-secondary)' }} />
                ))}
              </div>
              {/* WiFi */}
              <svg width="14" height="10" viewBox="0 0 24 18" fill="none">
                <path d="M12 18l2-2a2 2 0 00-4 0l2 2z" fill="var(--text-primary)"/>
                <path d="M6 13a8 8 0 0112 0" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M2 9a14 14 0 0120 0" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
              {/* Battery */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <div style={{
                  width: 20, height: 10, borderRadius: 2,
                  border: '1px solid #7a8fb0',
                  padding: '1.5px',
                }}>
                  <div style={{ width: '90%', height: '100%', borderRadius: 1, background: 'var(--color-green)' }} />
                </div>
                <div style={{ width: 2, height: 5, borderRadius: '0 1px 1px 0', background: 'var(--text-secondary)' }} />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            style={{
              flex: 1, overflowY: 'auto', paddingBottom: 20,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{
            padding: '6px 0 10px',
            display: 'flex', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{
              width: 80, height: 4, borderRadius: 999,
              background: 'var(--glass-border)',
            }} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
