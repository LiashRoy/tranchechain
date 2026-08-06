import { createContext, useState, useContext } from 'react'
import { buildInitialChain } from '../utils/chain'

const GlobalChainContext = createContext(null)

export function GlobalChainProvider({ children }) {
  const [demoBlocks, setDemoBlocksState] = useState(() => buildInitialChain())
  const [demoVersion, setDemoVersion] = useState(0)

  // Custom setter that increments version whenever live demo updates the blocks
  const setDemoBlocks = (newBlocksOrUpdater) => {
    setDemoBlocksState(prev => {
      const updated = typeof newBlocksOrUpdater === 'function' ? newBlocksOrUpdater(prev) : newBlocksOrUpdater
      return updated
    })
    setDemoVersion(v => v + 1)
  }

  return (
    <GlobalChainContext.Provider value={{ demoBlocks, setDemoBlocks, demoVersion }}>
      {children}
    </GlobalChainContext.Provider>
  )
}

export const useGlobalChain = () => useContext(GlobalChainContext)
