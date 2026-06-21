import { createContext, useContext } from 'react'
import type { MindMapNode } from '../lib/types'

export interface MindMapState {
  nodes: MindMapNode[]
  edges: { id: string; source: string; target: string }[]
  selectedNodes: Set<string>
  activeNodeId: string | null
}

export interface MindMapActions {
  setNodes: (nodes: MindMapNode[]) => void
  setEdges: (edges: { id: string; source: string; target: string }[]) => void
  setSelectedNodes: (ids: Set<string>) => void
  setActiveNodeId: (id: string | null) => void
  updateNodeText: (id: string, text: string) => void
}

const defaultState: MindMapState = {
  nodes: [],
  edges: [],
  selectedNodes: new Set(),
  activeNodeId: null,
}

const MindMapContext = createContext<{
  state: MindMapState
  actions: MindMapActions
}>({ state: defaultState, actions: {} as MindMapActions })

export function MindMapProvider({ children }: { children: React.ReactNode }) {
  function updateNodeText(_id: string, _text: string) {
    // Will be implemented with full state management
  }

  const state = defaultState
  const actions = {
    setNodes: () => {},
    setEdges: () => {},
    setSelectedNodes: () => {},
    setActiveNodeId: () => {},
    updateNodeText,
  }

  return (
    <MindMapContext.Provider value={{ state, actions }}>
      {children}
    </MindMapContext.Provider>
  )
}

export function useMindMapStore() {
  const context = useContext(MindMapContext)
  if (!context) {
    throw new Error('useMindMapStore must be used within a MindMapProvider')
  }
  return context
}
