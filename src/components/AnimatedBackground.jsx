import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const CHARS = '0123456789abcdef'
const randHash = (len = 8) =>
  Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * 16)]).join('')

const INITIAL_BLOCKS = [
  { id: 0, x: '5%',  y: '18%', delay: 0    },
  { id: 1, x: '23%', y: '62%', delay: 0.6  },
  { id: 2, x: '52%', y: '22%', delay: 1.1  },
  { id: 3, x: '74%', y: '58%', delay: 1.7  },
  { id: 4, x: '88%', y: '24%', delay: 0.3  },
]

function FloatingBlock({ block }) {
  const [hash, setHash] = useState(randHash(8))

  useEffect(() => {
    const iv = setInterval(() => setHash(randHash(8)), 1800 + block.id * 400)
    return () => clearInterval(iv)
  }, [block.id])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 0.25, 0.25, 0], // slightly reduced opacity globally so it doesn't distract too much
        scale:   [0.85, 1, 1, 0.85],
        y:       [0, -14, 0, 14, 0],
      }}
      transition={{
        duration: 9,
        delay: block.delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: 'easeInOut',
      }}
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div style={{
        width: 110,
        height: 72,
        borderRadius: '10px',
        background: 'rgba(15,26,46,0.3)',
        border: '1px solid rgba(59,140,255,0.1)',
        willChange: 'transform, opacity',
        padding: '10px 12px',
        boxShadow: '0 4px 24px rgba(59,140,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.58rem',
          color: 'rgba(59,140,255,0.4)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Block #{block.id + 1}
        </div>
        <motion.div
          key={hash}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.62rem',
            color: 'rgba(20,184,166,0.6)',
            letterSpacing: '0.02em',
          }}
        >
          {hash}…
        </motion.div>
        <div style={{
          height: '1px',
          background: 'var(--glass-border)',
          marginTop: '2px',
        }} />
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.55rem',
          color: 'rgba(100,130,180,0.3)',
        }}>
          prev: a3f9…
        </div>
      </div>

      {/* Connector line to next block (except last) */}
      {block.id < 4 && (
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, delay: block.delay }}
          style={{
            position: 'absolute',
            top: '36px',
            left: '112px',
            width: '32px',
            height: '1px',
            background: 'linear-gradient(90deg, rgba(59,140,255,0.3), rgba(20,184,166,0.15))',
          }}
        />
      )}
    </motion.div>
  )
}

export default function AnimatedBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {/* Animated Gradient Background */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundSize: '200% 200%',
          backgroundImage: 'linear-gradient(45deg, #3b8cff 25%, transparent 25%, transparent 50%, #14b8a6 50%, #14b8a6 75%, transparent 75%, transparent)',
        }}
      />

      {/* Floating block decoration */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {INITIAL_BLOCKS.map(b => <FloatingBlock key={b.id} block={b} />)}
      </div>
    </div>
  )
}
