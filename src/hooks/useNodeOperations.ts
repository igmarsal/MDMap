import { useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import type { MindMapNodeData } from '../lib/types'

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
}

function recomputeDeveloped(nodes: Node<MindMapNodeData>[], edges: Edge[]): Node<MindMapNodeData>[] {
  const childrenOf = new Map<string, string[]>()
  edges.forEach((e) => {
    const list = childrenOf.get(e.source) || []
    list.push(e.target)
    childrenOf.set(e.source, list)
  })

  function allChildrenDone(id: string): boolean {
    const children = childrenOf.get(id) || []
    if (children.length === 0) return true
    return children.every((c) => {
      const n = nodes.find((nd) => nd.id === c)
      return n && n.data.developed === 'done' && allChildrenDone(c)
    })
  }

  return nodes.map((n) => {
    const children = childrenOf.get(n.id) || []
    if (children.length === 0) return n
    const done = children.every((c) => allChildrenDone(c))
    if (done) return { ...n, data: { ...n.data, developed: 'done' as const } }
    return n
  })
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
}: UseNodeOperationsProps) {

  const handleAddChild = useCallback((parentId: string) => {
    pushHistory()
    const id = Math.random().toString(36).slice(2, 9)
    const parentNode = nodesRef.current.find((n) => n.id === parentId)
    if (!parentNode) return

    const siblings = edgesRef.current
      .filter((e) => e.source === parentId)
      .map((e) => nodesRef.current.find((n) => n.id === e.target))
      .filter(Boolean)
      .length

    const level = (parentNode.data.level || 0) + 1
    const verticalGap = 100
    const horizontalGap = 60
    const nodeWidth = 200

    const totalSiblingsWidth = nodeWidth * siblings + horizontalGap * Math.max(0, siblings - 1)
    const newX = parentNode.position.x - totalSiblingsWidth / 2 + (nodeWidth * siblings) / 2
    const newNode: Node<MindMapNodeData> = {
      id, type: 'mindMap', selected: true,
      position: { x: newX, y: parentNode.position.y + verticalGap },
      data: { text: t('newNode'), level, tags: [], developed: 'todo' as const },
    }
    setNodes((nds) => recomputeDeveloped([...nds, newNode], edgesRef.current))
    setEdges((eds) => [...eds, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' }])
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t])

  const handleAddSibling = useCallback((sourceId: string) => {
    pushHistory()
    const source = nodesRef.current.find((n) => n.id === sourceId)
    if (!source) return
    const parentId = edgesRef.current.find((e) => e.target === sourceId)?.source ?? null
    const id = Math.random().toString(36).slice(2, 9)
    const nodeWidth = 200
    const gap = 40

    const newNode: Node<MindMapNodeData> = {
      id, type: 'mindMap', selected: true,
      position: { x: source.position.x + nodeWidth + gap, y: source.position.y },
      data: { text: t('newNode'), level: source.data.level, tags: [], developed: 'todo' as const },
    }
    setNodes((nds) => recomputeDeveloped([...nds, newNode], edgesRef.current))
    setEdges((eds) => parentId
      ? [...eds, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' }]
      : eds)
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t])

  const handleAddRoot = useCallback(() => {
    pushHistory()
    const id = Math.random().toString(36).slice(2, 9)
    const roots = nodesRef.current.filter((n) => n.data.level === 0)
    const nodeWidth = 200
    const horizontalGap = 60
    const totalWidth = nodeWidth * roots.length + horizontalGap * roots.length
    const startX = -totalWidth / 2 + nodeWidth / 2

    const newNode: Node<MindMapNodeData> = {
      id, type: 'mindMap', selected: true,
      position: { x: startX, y: 0 },
      data: { text: t('newRoot'), level: 0, tags: [], developed: 'todo' as const },
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [nodesRef, setNodes, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t])

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
      if (!confirm(t('deleteConfirm', { count: toDelete.size }))) return
    }
    setNodes((nds) => {
      const filtered = nds.filter((n) => !toDelete.has(n.id))
      return recomputeDeveloped(filtered, edgesRef.current.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)))
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
  }, [edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave, pushHistory, t])

  const handleDeleteNode = useCallback((id: string) => {
    handleDeleteNodes([id])
  }, [handleDeleteNodes])

  const handleEditNode = useCallback((id: string, text: string, tags: string[], developed?: 'todo' | 'in-progress' | 'done') => {
    pushHistory()
    setNodes((nds) => {
      const updated = nds.map((n) => (n.id === id ? {
        ...n,
        data: { ...n.data, text, tags, developed: developed ?? n.data.developed ?? 'todo', editing: false },
      } : n))
      return recomputeDeveloped(updated, edgesRef.current)
    })
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [edgesRef, setNodes, setEditingNodeId, markDirty, scheduleSave, pushHistory])

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