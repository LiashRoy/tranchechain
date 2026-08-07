import { motion } from 'framer-motion'

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
    </div>
  )
}
