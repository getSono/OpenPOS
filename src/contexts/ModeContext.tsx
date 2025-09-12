'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type POSMode = 'normal' | 'kitchen'

interface ModeContextType {
  mode: POSMode
  setMode: (mode: POSMode) => void
  toggleMode: () => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<POSMode>('normal')

  const toggleMode = () => {
    setMode(prev => prev === 'normal' ? 'kitchen' : 'normal')
  }

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}