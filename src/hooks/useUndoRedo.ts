import { useState, useCallback, useRef } from 'react'
import type { HistorySnapshot, HistoryReason, MindMapNodeData } from '../lib/types'
import type { Node, Edge } from 'reactflow'

const MAX_HISTORY = 100

interface UseUndoRedoProps {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]
  currentMarkdown: string
  layoutMode: any
  collapsedNodeIds: Set<string>
  showDevelopedBranches: boolean
  manualPositions: Record<string, { x: number; y: number }>
}

export function useUndoRedo({
  nodes,
  edges,
  currentMarkdown,
  layoutMode,
  collapsedNodeIds,
  showDevelopedBranches,
  manualPositions,
}: UseUndoRedoProps) {
  const [history, setHistory] = useState<HistorySnapshot[]>([])
  const [future, setFuture] = useState<HistorySnapshot[]>([])
  const currentSnapshotRef = useRef<HistorySnapshot | null>(null)

  // Guardar snapshot actual
  const saveSnapshot = useCallback((reason: HistoryReason) => {
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      markdown: currentMarkdown,
      layoutMode,
      collapsedNodeIds: Array.from(collapsedNodeIds),
      showDevelopedBranches,
      manualPositions: JSON.parse(JSON.stringify(manualPositions)),
      timestamp: Date.now(),
      reason,
    }

    setHistory((prev) => {
      const newHistory = [...prev, snapshot]
      // Limitar historial
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(-MAX_HISTORY)
      }
      return newHistory
    })

    // Limpiar futuro cuando se hace un nuevo cambio
    setFuture([])
    currentSnapshotRef.current = snapshot
  }, [nodes, edges, currentMarkdown, layoutMode, collapsedNodeIds, showDevelopedBranches, manualPositions])

  const undo = useCallback(() => {
    if (history.length === 0) return false

    setHistory((prev) => {
      if (prev.length === 0) return prev

      const previousSnapshot = prev[prev.length - 2] || prev[0]
      setFuture((currentFuture) => [...currentFuture, prev[prev.length - 1]])

      currentSnapshotRef.current = previousSnapshot
      return prev.slice(0, -1)
    })

    return true
  }, [history])

  const redo = useCallback(() => {
    if (future.length === 0) return false

    setFuture((prev) => {
      if (prev.length === 0) return prev

      const nextSnapshot = prev[prev.length - 1]
      setHistory((currentHistory) => [...currentHistory, nextSnapshot])

      currentSnapshotRef.current = nextSnapshot
      return prev.slice(0, -1)
    })

    return true
  }, [future])

  const canUndo = history.length > 1
  const canRedo = future.length > 0

  const getCurrentSnapshot = useCallback((): HistorySnapshot | null => {
    return currentSnapshotRef.current
  }, [])

  // Limpiar historial al abrir archivo nuevo
  const clearHistory = useCallback(() => {
    setHistory([])
    setFuture([])
    currentSnapshotRef.current = null
  }, [])

  return {
    saveSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentSnapshot,
    clearHistory,
  }
}