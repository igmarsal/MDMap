import { useState, useCallback, useEffect, useRef } from 'react'
import { ReactFlowProvider, OnSelectionChangeParams } from 'reactflow'
import MindMapCanvas from './components/mindmap/MindMapCanvas'
import FileBar from './components/FileBar'
import Toolbar from './components/mindmap/Toolbar'
import { NodeCallbacksProvider } from './components/mindmap/NodeCallbacksContext'
import { useFileSystem } from './lib/fileSystem/useFileSystem'
import { mdToNodes } from './lib/parser/mdToNodes'
import { nodesToMd } from './lib/compiler/nodesToMd'
import type { MindMapNode } from './lib/types'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoSave } from './hooks/useAutoSave'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow'

const initialMd = '- Idea central\n  - Rama 1\n  - Rama 2\n'

function downloadMd(md: string, filename: string) {
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function recomputeDeveloped(nodes: Node[], edges: Edge[]): Node[] {
  const childrenOf = new Map<string, string[]>()
  edges.forEach((e) => {
    const list = childrenOf.get(e.source) || []
    list.push(e.target)
    childrenOf.set(e.source, list)
  })

  function allDescendantsDeveloped(id: string): boolean {
    const children = childrenOf.get(id) || []
    if (children.length === 0) {
      return !!((nodes.find((n) => n.id === id)?.data as any)?.developed)
    }
    return children.every((c) => {
      const childDeveloped = !!((nodes.find((n) => n.id === c)?.data as any)?.developed)
      return childDeveloped && allDescendantsDeveloped(c)
    })
  }

  return nodes.map((n) => {
    const children = childrenOf.get(n.id) || []
    if (children.length === 0) return n
    const developed = children.every((c) => allDescendantsDeveloped(c))
    return { ...n, data: { ...n.data, developed } }
  })
}

function nodesToMindMap(nodes: Node[], edges: Edge[]): MindMapNode[] {
  const childrenByParent = new Map<string | null, string[]>()

  edges.forEach((edge) => {
    const children = childrenByParent.get(edge.source) || []
    children.push(edge.target)
    childrenByParent.set(edge.source, children)
  })

  return nodes.map((node) => ({
    id: node.id,
    text: (node.data as any)?.text || '',
    level: (node.data as any)?.level || 0,
    parent: edges.find((edge) => edge.target === node.id)?.source || null,
    children: childrenByParent.get(node.id) || [],
    position: node.position,
    tags: (node.data as any)?.tags || [],
    developed: !!(node.data as any)?.developed,
  }))
}

function AppContent() {
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const handleRef = useRef<FileSystemFileHandle | null>(null)
  const dirtyRef = useRef(false)
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const selectedIdsRef = useRef<Set<string>>(new Set())
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [hasClipboard, setHasClipboard] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  nodesRef.current = nodes
  edgesRef.current = edges
  selectedIdsRef.current = selectedNodeIds

  const { openFile, saveFile } = useFileSystem()

  const doSave = useCallback(async (allowPicker: boolean) => {
    const n = nodesRef.current
    const e = edgesRef.current
    const md = nodesToMd(nodesToMindMap(n, e))

    if (handleRef.current) {
      try {
        await saveFile(md, handleRef.current)
        dirtyRef.current = false
        setDirty(false)
        return
      } catch (err) {
        console.error('Error al guardar, intentando con picker:', err)
        handleRef.current = null
      }
    }

    if (!allowPicker) return

    if ((window as any).showSaveFilePicker) {
      try {
        const pickerHandle = await (window as any).showSaveFilePicker({
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
          suggestedName: fileName || 'mdmap_plan.md',
        })
        await saveFile(md, pickerHandle)
        handleRef.current = pickerHandle
        setFileName(pickerHandle.name)
        dirtyRef.current = false
        setDirty(false)
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          console.error('Error al guardar:', e)
        }
      }
    } else {
      downloadMd(md, fileName || 'mdmap_plan.md')
      dirtyRef.current = false
      setDirty(false)
    }
  }, [fileName, saveFile])

  const { scheduleSave } = useAutoSave(
    () => nodesToMd(nodesToMindMap(nodesRef.current, edgesRef.current)),
    doSave,
    1500,
  )

  const handleSave = useCallback(async () => {
    await doSave(true)
  }, [doSave])

  const markDirty = useCallback(() => {
    dirtyRef.current = true
    setDirty(true)
  }, [])

  const loadParsedMd = useCallback((md: string) => {
    const parsed = mdToNodes(md)
    setNodes(parsed.map((n) => ({
      id: n.id, type: 'mindMap', position: n.position,
      data: { text: n.text, level: n.level, tags: n.tags, developed: n.developed },
    })))
    setEdges(parsed.flatMap((n) =>
      n.children.map((childId) => ({
        id: `${n.id}-${childId}`, source: n.id, target: childId, type: 'mindMap',
      })),
    ))
    setSelectedNodeIds(new Set())
    setEditingNodeId(null)
  }, [])

  const handleOpenFile = useCallback(async () => {
    if (editingNodeId) setEditingNodeId(null)
    if (dirtyRef.current) {
      if (!confirm('Hay cambios sin guardar. ¿Deseas abrir otro archivo?')) return
    }
    try {
      const { md, state } = await openFile()
      handleRef.current = state.fileHandle
      setFileName(state.fileName)
      dirtyRef.current = false
      setDirty(false)
      loadParsedMd(md)
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') {
        console.error('Error al abrir archivo:', e)
      }
    }
  }, [editingNodeId, loadParsedMd, openFile])

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const next = applyNodeChanges(changes, nds)
      markDirty()
      scheduleSave()
      return next
    })
  }, [markDirty, scheduleSave])

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const next = applyEdgeChanges(changes, eds)
      markDirty()
      scheduleSave()
      return next
    })
  }, [markDirty, scheduleSave])

  const handleConnect: OnConnect = useCallback((connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'mindMap' }, eds))
    markDirty()
    scheduleSave()
  }, [markDirty, scheduleSave])

  const handleAddChild = useCallback((parentId: string) => {
    const id = Math.random().toString(36).slice(2, 9)
    const parentNode = nodesRef.current.find((n) => n.id === parentId)
    if (!parentNode) return

    const siblings = edgesRef.current
      .filter((e) => e.source === parentId)
      .map((e) => nodesRef.current.find((n) => n.id === e.target))
      .filter(Boolean)
      .length

    const level = ((parentNode.data as any)?.level || 0) + 1
    const verticalGap = 100
    const horizontalGap = 60
    const nodeWidth = 200

    const totalSiblingsWidth = nodeWidth * siblings + horizontalGap * Math.max(0, siblings - 1)
    const newX = parentNode.position.x - totalSiblingsWidth / 2 + (nodeWidth * siblings) / 2
    const newNode: Node = {
      id, type: 'mindMap', selected: true,
      position: { x: newX, y: parentNode.position.y + verticalGap },
      data: { text: 'Nuevo nodo', level, tags: [], developed: false },
    }
    setNodes((nds) => recomputeDeveloped([...nds, newNode], edgesRef.current))
    setEdges((eds) => [...eds, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' }])
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [markDirty, scheduleSave])

  const handleAddRoot = useCallback(() => {
    const id = Math.random().toString(36).slice(2, 9)
    const roots = nodesRef.current.filter((n) => (n.data as any)?.level === 0)
    const nodeWidth = 200
    const horizontalGap = 60
    const totalWidth = nodeWidth * roots.length + horizontalGap * roots.length
    const startX = -totalWidth / 2 + nodeWidth / 2

    const newNode: Node = {
      id, type: 'mindMap', selected: true,
      position: { x: startX, y: 0 },
      data: { text: 'Nuevo nodo raíz', level: 0, tags: [], developed: false },
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeIds(new Set([id]))
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [markDirty, scheduleSave])

  const handleDeleteNodes = useCallback((ids: string[]) => {
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
      if (!confirm(`Se eliminarán ${toDelete.size} nodos. ¿Continuar?`)) return
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
    if (editingNodeId && toDelete.has(editingNodeId)) setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [editingNodeId, markDirty, scheduleSave])

  const handleDeleteNode = useCallback((id: string) => {
    handleDeleteNodes([id])
  }, [handleDeleteNodes])

  const handleEditNode = useCallback((id: string, text: string, tags: string[], developed?: boolean) => {
    setNodes((nds) => {
      const updated = nds.map((n) => (n.id === id ? {
        ...n,
        data: { ...n.data, text, tags, developed: developed ?? (n.data as any)?.developed ?? false, editing: false },
      } : n))
      return recomputeDeveloped(updated, edgesRef.current)
    })
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [markDirty, scheduleSave])

  const handleStartEdit = useCallback((id: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? {
      ...n,
      data: { ...n.data, editing: true },
    } : n)))
    setEditingNodeId(id)
  }, [])

  const handleStopEdit = useCallback((id: string) => {
    if (editingNodeId && editingNodeId !== id) return
    setNodes((nds) => nds.map((n) => (n.id === editingNodeId ? {
      ...n,
      data: { ...n.data, editing: false },
    } : n)))
    setEditingNodeId(null)
  }, [editingNodeId])

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
  }, [editingNodeId, selectedNodeIds])

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || editingNodeId) return
    const { nodes: clipNodes, edges: clipEdges } = clipboardRef.current
    if (clipNodes.length === 0) return

    const idMap = new Map<string, string>()
    const newNodes: Node[] = clipNodes.map((n) => {
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
  }, [editingNodeId, markDirty, scheduleSave])

  useEffect(() => {
    if (nodes.length === 0) {
      loadParsedMd(initialMd)
    }
  }, [loadParsedMd, nodes.length])

  useKeyboardShortcuts({
    onSave: handleSave,
    onDelete: () => {
      if (selectedIdsRef.current.size > 0 && !editingNodeId) {
        handleDeleteNodes(Array.from(selectedIdsRef.current))
      }
    },
    onCopy: handleCopy,
    onPaste: handlePaste,
  })

  const setSelectedNodeIdsStable = useCallback((ids: Set<string>) => {
    setSelectedNodeIds((prev) => {
      if (prev.size === ids.size && Array.from(prev).every((id) => ids.has(id))) {
        return prev
      }
      return ids
    })
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <FileBar
        fileName={fileName ? `${fileName}${dirty ? ' *' : ''}` : dirty ? 'Sin guardar...' : null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
      />
      <main className="flex-1 relative">
        <Toolbar
          selectedNodeIds={selectedNodeIds}
          editingNodeId={editingNodeId}
          hasClipboard={hasClipboard}
          onAddRoot={handleAddRoot}
          onAddChild={() => {
            const first = Array.from(selectedNodeIds)[0]
            if (first) handleAddChild(first)
          }}
          onDelete={() => handleDeleteNodes(Array.from(selectedNodeIds))}
          onCopy={handleCopy}
          onPaste={handlePaste}
         />
         <NodeCallbacksProvider
          onAddChild={handleAddChild}
          onDelete={handleDeleteNode}
          onEdit={handleEditNode}
          onStartEdit={handleStartEdit}
          onStopEdit={handleStopEdit}
          onSelect={(id) => {
            setSelectedNodeIdsStable(new Set([id]))
            if (editingNodeId && id !== editingNodeId) setEditingNodeId(null)
          }}
        >
          <MindMapCanvas
            nodes={nodes}
            edges={edges}
            editingNodeId={editingNodeId}
            searchQuery={searchQuery}
            onSelectionChange={(params: OnSelectionChangeParams) => {
              setSelectedNodeIdsStable(new Set(params.nodes.map((n) => n.id)))
            }}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
          />
        </NodeCallbacksProvider>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  )
}
