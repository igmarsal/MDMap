import { useRef, useState, useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import type { MindMapNodeData } from '../lib/types'
import { recomputeDeveloped } from '../lib/developedUtils'

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