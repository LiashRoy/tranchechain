import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import Ledger from './pages/Ledger'
import TamperTest from './pages/TamperTest'
import Signatures from './pages/Signatures'
import Dashboard from './pages/Dashboard'
import About from './pages/About'

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/"             element={<PageTransition><Home /></PageTransition>} />
          <Route path="/how-it-works" element={<PageTransition><HowItWorks /></PageTransition>} />
          <Route path="/ledger"       element={<PageTransition><Ledger /></PageTransition>} />
          <Route path="/tamper-test"  element={<PageTransition><TamperTest /></PageTransition>} />
          <Route path="/signatures"   element={<PageTransition><Signatures /></PageTransition>} />
          <Route path="/dashboard"    element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/about"        element={<PageTransition><About /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
