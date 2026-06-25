import { useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import type { MindMapNodeData, DevState, LayoutMode } from '../lib/types'
import { recomputeDeveloped } from '../lib/developedUtils'
import { toParsedNodes, applyLayout } from '../lib/layout'

interface UseNodeOperationsProps {
  nodesRef: React.MutableRefObject<Node<MindMapNodeData>[]>
  edgesRef: React.MutableRefObject<Edge[]>
  setNodes: React.Dispatch<React.SetStateAction<Node<MindMapNodeData>[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setEditingNodeId: React.Dispatch<React.SetStateAction<string | null>>
  markDirty: () => void
  scheduleSave: () => void
  pushHistory: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
  layoutMode: LayoutMode
}

export function useNodeOperations({
  nodesRef,
  edgesRef,
  setNodes,
  setEdges,
  setSelectedNodeIds,
  setEditingNodeId,
  markDirty,
  scheduleSave,
  pushHistory,
  t,
  layoutMode,
}: UseNodeOperationsProps) {

  /** Aplica layout a los nodos actualizados dentro de un setNodes callback */
  const applyLayoutToNodes = useCallback(
    (nds: Node<MindMapNodeData>[], eds: Edge[]) => {
      const parsed = toParsedNodes(nds, eds)
      const positions = applyLayout(parsed, layoutMode)
      return nds.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
      }))
    },
    [layoutMode],
  )

  const handleAddChild = useCallback((parentId: string) => {
    pushHistory()
    const id = Math.random().toString(36).slice(2, 9)
    const parentNode = nodesRef.current.find((n) => n.id === parentId)
    if (!parentNode) return

    const level = (parentNode.data.level || 0) + 1
    const newNode: Node<MindMapNodeData> = {
      id, type: 'mindMap' as const, selected: true,
      position: { x: 0, y: 0 },
      data: { text: t('newNode'), level, tags: [], developed: 'todo' as const },
    }
    setNodes((nds) => {
      const withNew = recomputeDeveloped([...nds, newNode], edgesRef.current)
      const newEdges = [...edgesRef.current, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' as const }]
      return applyLayoutToNodes(withNew, newEdges)
    })
    setEdges((eds) => [...eds, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' as const }])
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t, applyLayoutToNodes])

  const handleAddSibling = useCallback((sourceId: string) => {
    pushHistory()
    const source = nodesRef.current.find((n) => n.id === sourceId)
    if (!source) return
    const parentId = edgesRef.current.find((e) => e.target === sourceId)?.source ?? null
    const id = Math.random().toString(36).slice(2, 9)

    const newNode: Node<MindMapNodeData> = {
      id, type: 'mindMap' as const, selected: true,
      position: { x: 0, y: 0 },
      data: { text: t('newNode'), level: source.data.level, tags: [], developed: 'todo' as const },
    }
    setNodes((nds) => {
      const withNew = recomputeDeveloped([...nds, newNode], edgesRef.current)
      const newEdges = parentId
        ? [...edgesRef.current, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' as const }]
        : edgesRef.current
      return applyLayoutToNodes(withNew, newEdges)
    })
    setEdges((eds) => parentId
      ? [...eds, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' as const }]
      : eds)
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t, applyLayoutToNodes])

  const handleAddRoot = useCallback(() => {
    pushHistory()
    const id = Math.random().toString(36).slice(2, 9)

    const newNode: Node<MindMapNodeData> = {
      id, type: 'mindMap' as const, selected: true,
      position: { x: 0, y: 0 },
      data: { text: t('newRoot'), level: 0, tags: [], developed: 'todo' as const },
    }
    setNodes((nds) => applyLayoutToNodes([...nds, newNode], edgesRef.current))
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [nodesRef, setNodes, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t, applyLayoutToNodes, edgesRef])

  const handleDeleteNodes = useCallback((ids: string[]) => {
    pushHistory()
    if (ids.length === 0) return
    const toDelete = new Set(ids)
    let changed = true
    while (changed) {
      changed = false
      edgesRef.current.forEach((e) => {
        if (toDelete.has(e.source) && !toDelete.has(e.target)) {
          toDelete.add(e.target)
          changed = true
        }
      })
    }
    if (toDelete.size > 1) {
      // eslint-disable-next-line no-alert
      if (!confirm(t('deleteConfirm', { count: toDelete.size }))) return
    }
    const remainingEdges = edgesRef.current.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target))
    setNodes((nds) => {
      const filtered = nds.filter((n) => !toDelete.has(n.id))
      const devUpdated = recomputeDeveloped(filtered, remainingEdges)
      return applyLayoutToNodes(devUpdated, remainingEdges)
    })
    setEdges((eds) => eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)))
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      for (const id of prev) {
        if (toDelete.has(id)) next.delete(id)
      }
      return next
    })
    setEditingNodeId((prev) => prev && toDelete.has(prev) ? null : prev)
    markDirty()
    scheduleSave()
  }, [edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t, applyLayoutToNodes])

  const handleDeleteNode = useCallback((id: string) => {
    handleDeleteNodes([id])
  }, [handleDeleteNodes])

  const handleEditNode = useCallback((id: string, text: string, tags: string[], developed?: DevState) => {
    pushHistory()
    setNodes((nds) => {
      const updated = nds.map((n) => (n.id === id ? {
        ...n,
        data: { ...n.data, text, tags, developed: developed ?? n.data.developed ?? 'todo', editing: false },
      } : n))
      const devUpdated = recomputeDeveloped(updated, edgesRef.current)
      return applyLayoutToNodes(devUpdated, edgesRef.current)
    })
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [edgesRef, setNodes, setEditingNodeId, markDirty, scheduleSave, pushHistory, applyLayoutToNodes])

  const handleStartEdit = useCallback((id: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? {
      ...n,
      data: { ...n.data, editing: true },
    } : n)))
    setEditingNodeId(id)
  }, [setNodes, setEditingNodeId])

  const handleStopEdit = useCallback((id: string, editingNodeId: string | null) => {
    if (editingNodeId && editingNodeId !== id) return
    setNodes((nds) => nds.map((n) => (n.id === editingNodeId ? {
      ...n,
      data: { ...n.data, editing: false },
    } : n)))
    setEditingNodeId(null)
  }, [setNodes, setEditingNodeId])

  return {
    handleAddChild,
    handleAddSibling,
    handleAddRoot,
    handleDeleteNodes,
    handleDeleteNode,
    handleEditNode,
    handleStartEdit,
    handleStopEdit,
  }
}