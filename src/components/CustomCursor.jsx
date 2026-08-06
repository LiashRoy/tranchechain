import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;

    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const handleMouseOver = (e) => {
      const target = e.target
      const isClickable = 
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'select' ||
        target.tagName.toLowerCase() === 'input' ||
        target.closest('a') || 
        target.closest('button') ||
        target.classList.contains('clickable') ||
        window.getComputedStyle(target).cursor === 'pointer'
        
      setIsHovering(!!isClickable)
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  const variants = {
    default: {
      x: mousePosition.x - 8,
      y: mousePosition.y - 8,
      height: 16,
      width: 16,
      backgroundColor: 'rgba(96, 165, 250, 0.4)',
      border: '1px solid rgba(96, 165, 250, 0.8)',
      transition: { type: 'tween', ease: 'easeOut', duration: 0.1 }
    },
    hover: {
      x: mousePosition.x - 24,
      y: mousePosition.y - 24,
      height: 48,
      width: 48,
      backgroundColor: 'rgba(96, 165, 250, 0.1)',
      border: '1px solid rgba(96, 165, 250, 0.5)',
      transition: { type: 'tween', ease: 'easeOut', duration: 0.15 }
    }
  }

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          body, a, button, select, input, .clickable {
            cursor: none !important;
          }
        }
      `}</style>
      <motion.div
        variants={variants}
        animate={isHovering ? 'hover' : 'default'}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'screen'
        }}
      />
      <motion.div
        animate={{ x: mousePosition.x - 2, y: mousePosition.y - 2 }}
        transition={{ type: 'tween', duration: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 4,
          height: 4,
          backgroundColor: '#60a5fa',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      />
    </>
  )
}
