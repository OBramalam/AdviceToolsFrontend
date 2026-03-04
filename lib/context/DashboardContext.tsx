'use client'

// Dashboard Context – selected plan shared between dashboard page and chat sidebar

import { createContext, useContext, useState } from 'react'

interface DashboardContextType {
  selectedPlanId: number | null
  setSelectedPlanId: (id: number | null) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  return (
    <DashboardContext.Provider value={{ selectedPlanId, setSelectedPlanId }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
}
