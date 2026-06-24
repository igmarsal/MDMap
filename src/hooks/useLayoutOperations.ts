import { useCallback } from 'react'
import type { LayoutMode } from '../lib/types'
import { applyLayout } from '../lib/layout'
import { toParsedNodes } from '../lib/layout/layoutUtils'

interface UseLayoutOperationsProps {
  nodesRef: React.MutableRefObject<import('reactflow').Node[]>
  edgesRef: React.MutableRefObject<import('reactflow').Edge[]>
  setNodes: React.Dispatch<React.SetStateAction<import('reactflow').Node[]>>
  setLayoutMode: React.Dispatch<React.SetStateAction<LayoutMode>>
  markDirty: () => void
  scheduleSave: () => void
}

export function useLayoutOperations({
  nodesRef,
  edgesRef,
  setNodes,
  setLayoutMode,
  markDirty,
  scheduleSave,
}: UseLayoutOperationsProps) {
  const handleRelayout = useCallback((mode: LayoutMode) => {
    const parsedNodes = toParsedNodes(nodesRef.current, edgesRef.current)
    const positions = applyLayout(parsedNodes, mode)

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
      }))
    )

    setLayoutMode(mode)
    markDirty()
    scheduleSave()
  }, [nodesRef, edgesRef, setNodes, setLayoutMode, markDirty, scheduleSave])

  const handleReorganize = useCallback(() => {
    const parsedNodes = toParsedNodes(nodesRef.current, edgesRef.current)
    const positions = applyLayout(parsedNodes, nodesRef.current[0]?.data.layoutMode || 'horizontal')

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
      }))
    )

    markDirty()
    scheduleSave()
  }, [nodesRef, edgesRef, setNodes, markDirty, scheduleSave])

  return {
    handleRelayout,
    handleReorganize,
  }
}