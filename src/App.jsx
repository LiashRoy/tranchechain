import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import Demo from './pages/Demo'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import CustomCursor from './components/CustomCursor'
import { GlobalChainProvider } from './context/GlobalChainContext'
import { ThemeProvider } from './context/ThemeContext'

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
          <Route path="/demo"         element={<PageTransition><Demo /></PageTransition>} />
          <Route path="/dashboard"    element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/about"        element={<PageTransition><About /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <GlobalChainProvider>
      <HashRouter>
        <CustomCursor />
        <AnimatedRoutes />
      </HashRouter>
    </GlobalChainProvider>
    </ThemeProvider>
  )
}
