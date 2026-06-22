import { useState, useCallback, useEffect, useRef } from 'react'
import { ReactFlowProvider } from 'reactflow'
import MindMapCanvas from './components/mindmap/MindMapCanvas'
import FileBar from './components/FileBar'
import Toolbar from './components/mindmap/Toolbar'
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [hasClipboard, setHasClipboard] = useState(false)

  nodesRef.current = nodes
  edgesRef.current = edges

  const { openFile, saveFile, openDirectory } = useFileSystem()

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
      data: { text: n.text, level: n.level, tags: n.tags },
    })))
    setEdges(parsed.flatMap((n) =>
      n.children.map((childId) => ({
        id: `${n.id}-${childId}`, source: n.id, target: childId, type: 'mindMap',
      })),
    ))
    setSelectedNodeId(null)
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

  const handleOpenDirectory = useCallback(async () => {
    if (editingNodeId) setEditingNodeId(null)
    if (dirtyRef.current) {
      if (!confirm('Hay cambios sin guardar. ¿Deseas abrir otra carpeta?')) return
    }
    try {
      const { md, state } = await openDirectory()
      handleRef.current = state.fileHandle
      setFileName(state.fileName)
      dirtyRef.current = false
      setDirty(false)
      loadParsedMd(md)
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') {
        console.error('Error al abrir directorio:', e)
      }
    }
  }, [editingNodeId, loadParsedMd, openDirectory])

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

    const level = ((parentNode.data as any)?.level || 0) + 1
    const verticalGap = 100
    const horizontalGap = 60
    const nodeWidth = 200

    const siblingCount = siblings.length
    const totalSiblingsWidth = nodeWidth * siblingCount + horizontalGap * Math.max(0, siblingCount - 1)
    const newX = parentNode.position.x - totalSiblingsWidth / 2 + (nodeWidth * siblingCount) / 2
    const newNode: Node = {
      id, type: 'mindMap',
      position: { x: newX, y: parentNode.position.y + verticalGap },
      data: { text: 'Nuevo nodo', level, tags: [] },
    }
    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, { id: `${parentId}-${id}`, source: parentId, target: id, type: 'mindMap' }])
    setSelectedNodeId(id)
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
      id, type: 'mindMap',
      position: { x: startX, y: 0 },
      data: { text: 'Nuevo nodo raíz', level: 0, tags: [] },
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeId(id)
    setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [markDirty, scheduleSave])

  const handleDeleteNode = useCallback((id: string) => {
    const toDelete = new Set<string>([id])
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
    setNodes((nds) => nds.filter((n) => !toDelete.has(n.id)))
    setEdges((eds) => eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)))
    if (selectedNodeId && toDelete.has(selectedNodeId)) setSelectedNodeId(null)
    if (editingNodeId && toDelete.has(editingNodeId)) setEditingNodeId(null)
    markDirty()
    scheduleSave()
  }, [editingNodeId, markDirty, scheduleSave, selectedNodeId])

  const handleEditNode = useCallback((id: string, text: string, tags: string[]) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? {
      ...n,
      data: { ...n.data, text, tags, editing: false },
    } : n)))
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

  const handleStopEdit = useCallback(() => {
    setNodes((nds) => nds.map((n) => (n.id === editingNodeId ? {
      ...n,
      data: { ...n.data, editing: false },
    } : n)))
    setEditingNodeId(null)
  }, [editingNodeId])

  const handleCopy = useCallback(() => {
    if (!selectedNodeId || editingNodeId) return
    const ids = new Set<string>([selectedNodeId])
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
    setHasClipboard(true)
  }, [editingNodeId, selectedNodeId])

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
    setNodes((nds) => [...nds, ...newNodes])
    setEdges((eds) => [...eds, ...newEdges])
    setSelectedNodeId(newNodes[0].id)
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
    onDelete: selectedNodeId && !editingNodeId ? () => handleDeleteNode(selectedNodeId) : undefined,
    onCopy: handleCopy,
    onPaste: handlePaste,
  })

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <FileBar
        fileName={fileName ? `${fileName}${dirty ? ' *' : ''}` : dirty ? 'Sin guardar...' : null}
        onOpenFile={handleOpenFile}
        onOpenDirectory={handleOpenDirectory}
        onSave={handleSave}
      />
      <main className="flex-1 relative">
        <Toolbar
          selectedNodeId={selectedNodeId}
          editingNodeId={editingNodeId}
          hasClipboard={hasClipboard}
          onAddRoot={handleAddRoot}
          onAddChild={() => { if (selectedNodeId) handleAddChild(selectedNodeId) }}
          onDelete={() => { if (selectedNodeId) handleDeleteNode(selectedNodeId) }}
          onCopy={handleCopy}
          onPaste={handlePaste}
        />
        <MindMapCanvas
          nodes={nodes}
          edges={edges}
          editingNodeId={editingNodeId}
          onSelectNode={(id) => {
            setSelectedNodeId(id)
            if (editingNodeId && id !== editingNodeId) setEditingNodeId(null)
          }}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onAddChild={handleAddChild}
          onDeleteNode={handleDeleteNode}
          onEditNode={handleEditNode}
          onStartEdit={handleStartEdit}
          onStopEdit={handleStopEdit}
        />
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
