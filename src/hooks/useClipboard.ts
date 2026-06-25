import { useRef, useState, useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import type { MindMapNodeData, DevState } from '../lib/types'

interface UseClipboardProps {
  nodesRef: React.MutableRefObject<Node<MindMapNodeData>[]>
  edgesRef: React.MutableRefObject<Edge[]>
  setNodes: React.Dispatch<React.SetStateAction<Node<MindMapNodeData>[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setEditingNodeId: React.Dispatch<React.SetStateAction<string | null>>
  markDirty: () => void
  scheduleSave: () => void
  editingNodeId: string | null
  selectedNodeIds: Set<string>
}

function recomputeDeveloped(nodes: Node<MindMapNodeData>[], edges: Edge[]): Node<MindMapNodeData>[] {
  const childrenOf = new Map<string, string[]>()
  edges.forEach((e) => {
    const list = childrenOf.get(e.source) || []
    list.push(e.target)
    childrenOf.set(e.source, list)
  })

  function computeState(id: string): DevState {
    const children = childrenOf.get(id) || []
    if (children.length === 0) {
      const n = nodes.find((nd) => nd.id === id)
      return n ? n.data.developed : 'todo'
    }
    let hasInProgress = false
    for (const c of children) {
      const state = computeState(c)
      if (state === 'in-progress') hasInProgress = true
    }
    const allDone = children.every((c) => computeState(c) === 'done')
    if (allDone) return 'done'
    if (hasInProgress) return 'in-progress'
    const n = nodes.find((nd) => nd.id === id)
    return n ? n.data.developed : 'todo'
  }

  return nodes.map((n) => {
    const children = childrenOf.get(n.id) || []
    if (children.length === 0) return n
    const newState = computeState(n.id)
    if (newState !== n.data.developed) {
      return { ...n, data: { ...n.data, developed: newState } }
    }
    return n
  })
}

export function useClipboard({
  nodesRef,
  edgesRef,
  setNodes,
  setEdges,
  setSelectedNodeIds,
  setEditingNodeId,
  markDirty,
  scheduleSave,
  editingNodeId,
  selectedNodeIds,
}: UseClipboardProps) {
  const clipboardRef = useRef<{ nodes: Node<MindMapNodeData>[]; edges: Edge[] } | null>(null)
  const [hasClipboard, setHasClipboard] = useState(false)

  const handleCopy = useCallback(() => {
    if (selectedNodeIds.size === 0 || editingNodeId) return

    const ids = new Set(selectedNodeIds)
    let changed = true
    while (changed) {
      changed = false
      edgesRef.current.forEach((e) => {
        if (ids.has(e.source) && !ids.has(e.target)) {
          ids.add(e.target)
          changed = true
        }
      })
    }
    clipboardRef.current = {
      nodes: nodesRef.current.filter((n) => ids.has(n.id)).map((n) => ({ ...n })),
      edges: edgesRef.current.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ ...e })),
    }
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
    setSelectedNodeIds(new Set())
    setHasClipboard(true)
  }, [editingNodeId, selectedNodeIds, nodesRef, edgesRef, setNodes, setSelectedNodeIds])

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || editingNodeId) return
    const { nodes: clipNodes, edges: clipEdges } = clipboardRef.current
    if (clipNodes.length === 0) return

    const idMap = new Map<string, string>()
    const newNodes: Node<MindMapNodeData>[] = clipNodes.map((n) => {
      const newId = Math.random().toString(36).slice(2, 9)
      idMap.set(n.id, newId)
      return {
        ...n,
        id: newId,
        selected: true,
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        data: { ...n.data },
      }
    })
    const newEdges: Edge[] = clipEdges.map((e) => ({
      ...e,
      id: `${idMap.get(e.source)!}-${idMap.get(e.target)!}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }))
    setNodes((nds) => {
      const allNodes = recomputeDeveloped([...nds, ...newNodes], [...edgesRef.current, ...newEdges])
      const pastedIds = new Set(newNodes.map((n) => n.id))
      return allNodes.map((n) => ({ ...n, selected: pastedIds.has(n.id) }))
    })
    setEdges((eds) => [...eds, ...newEdges])
    setSelectedNodeIds(new Set(newNodes.map((n) => n.id)))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [editingNodeId, nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeIds, setEditingNodeId, markDirty, scheduleSave])

  return {
    clipboardRef,
    hasClipboard,
    handleCopy,
    handlePaste,
  }
}