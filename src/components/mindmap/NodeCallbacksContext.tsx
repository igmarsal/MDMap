import { createContext, useContext } from 'react'
import type { DevState } from '../../lib/types'

export interface NodeCallbacks {
  onAddChild: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string, tags: string[], developed?: DevState) => void
  onStartEdit: (id: string) => void
  onStopEdit: (id: string) => void
  onSelect: (id: string) => void
  onToggleCollapse?: (id: string) => void
}

export const NodeCallbacksContext = createContext<NodeCallbacks | null>(null)

export function NodeCallbacksProvider({ children, ...value }: { children: React.ReactNode } & NodeCallbacks) {
  return (
    <NodeCallbacksContext.Provider value={value}>
      {children}
    </NodeCallbacksContext.Provider>
  )
}

export function useNodeCallbacks() {
  const ctx = useContext(NodeCallbacksContext)
  if (!ctx) {
    throw new Error('useNodeCallbacks must be used within NodeCallbacksProvider')
  }
  return ctx
}
