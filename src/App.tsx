import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { ReactFlowProvider, OnSelectionChangeParams, useReactFlow } from 'reactflow'
import MindMapCanvas from './components/mindmap/MindMapCanvas'
import FileBar from './components/FileBar'
import Toolbar from './components/mindmap/Toolbar'
import OutlinePanel from './components/mindmap/OutlinePanel'
import FiltersPanel from './components/mindmap/FiltersPanel'
import { NodeCallbacksProvider } from './components/mindmap/NodeCallbacksContext'
import { useFileSystem } from './lib/fileSystem/useFileSystem'
import { mdToNodes } from './lib/parser/mdToNodes'
import { nodesToMd } from './lib/compiler/nodesToMd'
import type { MindMapNode, MindMapNodeData, LayoutMode } from './lib/types'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoSave } from './hooks/useAutoSave'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow'
import { I18nProvider, useI18n } from './lib/i18n'
import { useLayoutMode } from './hooks/useLayoutMode'
import { useCollapsedNodes } from './hooks/useCollapsedNodes'
import { useMapFilters } from './hooks/useMapFilters'
import { useNodeOperations } from './hooks/useNodeOperations'
import { useClipboard } from './hooks/useClipboard'
import { toParsedNodes, applyLayout, getHiddenDescendantIds } from './lib/layout'
import { useMapExport } from './hooks/useMapExport'

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

function nodesToMindMap(nodes: Node<MindMapNodeData>[], edges: Edge[]): MindMapNode[] {
  const childrenByParent = new Map<string | null, string[]>()

  edges.forEach((edge) => {
    const children = childrenByParent.get(edge.source) || []
    children.push(edge.target)
    childrenByParent.set(edge.source, children)
  })

  return nodes.map((node) => ({
    id: node.id,
    text: node.data.text || '',
    level: node.data.level || 0,
    parent: edges.find((edge) => edge.target === node.id)?.source || null,
    children: childrenByParent.get(node.id) || [],
    position: node.position,
    tags: node.data.tags || [],
    developed: (node.data.developed || 'todo') as import('./lib/types').DevState,
  }))
}

function getDescendantsCount(nodeId: string, edges: Edge[]): number {
  const children = edges.filter(e => e.source === nodeId).map(e => e.target)
  let count = children.length
  
  for (const childId of children) {
    count += getDescendantsCount(childId, edges)
  }
  
  return count
}

function AppContent() {
  const { t } = useI18n()
  const reactFlowInstance = useReactFlow()
  
  // Referencias
  const nodesRef = useRef<Node<MindMapNodeData>[]>([])
  const edgesRef = useRef<Edge[]>([])
  const handleRef = useRef<FileSystemFileHandle | null>(null)
  const dirtyRef = useRef(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Estados principales
  const [fileName, setFileName] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Node<MindMapNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const selectedIdsRef = useRef<Set<string>>(new Set())
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showBody, setShowBody] = useState(false)
  
  // Estados nuevos para las mejoras
  const { layoutMode, setLayoutMode } = useLayoutMode()
  const { collapsedNodeIds, toggleCollapse, expandAll, collapseAll } = useCollapsedNodes()
  const { filters, setFilters, clearFilters } = useMapFilters()
  const [showDevelopedBranches, setShowDevelopedBranches] = useState(true)
  const [fitViewRequested, setFitViewRequested] = useState(false)
  const [outlineVisible, setOutlineVisible] = useState(false)
  const [filtersVisible, setFiltersVisible] = useState(false)

  // Manual positions (persisted in localStorage)
  const [manualPositions, setManualPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('mdmap_manual_positions')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Undo/Redo
  const historyRef = useRef<Array<{ nodes: Node<MindMapNodeData>[]; edges: Edge[] }>>([])
  const futureRef = useRef<Array<{ nodes: Node<MindMapNodeData>[]; edges: Edge[] }>>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const pushHistory = useCallback(() => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    })
    if (historyRef.current.length > 100) {
      historyRef.current.shift()
    }
    futureRef.current = []
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(false)
  }, [])

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return
    
    futureRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    })
    
    const prev = historyRef.current.pop()!
    setNodes(prev.nodes)
    setEdges(prev.edges)
    setFitViewRequested(true)
    
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }, [])

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return
    
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    })
    
    const next = futureRef.current.pop()!
    setNodes(next.nodes)
    setEdges(next.edges)
    setFitViewRequested(true)
    
    setCanUndo(true)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  // Export PNG
  const { exportAndDownload } = useMapExport()

  const handleExportPng = useCallback(async () => {
    if (!canvasContainerRef.current) return
    const container = canvasContainerRef.current.querySelector('.react-flow') as HTMLElement
    if (!container) return
    const success = await exportAndDownload(container, {
      format: 'png',
      scope: 'current',
      background: 'white',
    }, `mdmap_${fileName || 'export'}.png`)
    if (!success) {
      console.error('Error al exportar PNG')
    }
  }, [exportAndDownload, fileName])

  // Handle node drag stop - save manual position
  const handleNodeDragStop: import('reactflow').NodeDragHandler = useCallback((_event, node) => {
    setManualPositions((prev) => {
      const next = { ...prev, [node.id]: { x: node.position.x, y: node.position.y } }
      localStorage.setItem('mdmap_manual_positions', JSON.stringify(next))
      return next
    })
  }, [])

  // Actualizar referencias
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
          suggestedName: fileName || t('suggestFileName'),
        })
        await saveFile(md, pickerHandle)
        handleRef.current = pickerHandle
        setFileName(pickerHandle.name)
        dirtyRef.current = false
        setDirty(false)
      } catch (e) {
        if (!(e instanceof Error && e.name === 'AbortError')) {
          console.error('Error al guardar:', e)
        }
      }
    } else {
      downloadMd(md, fileName || t('suggestFileName'))
      dirtyRef.current = false
      setDirty(false)
    }
  }, [fileName, saveFile, t])

  const { scheduleSave } = useAutoSave(
    () => nodesToMd(nodesToMindMap(nodesRef.current, edgesRef.current)),
    doSave,
    1500,
    // El autoguardado solo es efectivo cuando hay un FileHandle nativo que
    // sobrescribir (Chrome/Edge con File System Access API).
    () => handleRef.current !== null,
  )

  const handleSave = useCallback(async () => {
    await doSave(true)
  }, [doSave])

  const markDirty = useCallback(() => {
    dirtyRef.current = true
    setDirty(true)
  }, [])

  // Node operations hook (after all dependencies are declared)
  const {
    handleAddChild,
    handleAddSibling,
    handleAddRoot,
    handleDeleteNodes,
    handleDeleteNode,
    handleEditNode,
    handleStartEdit,
    handleStopEdit: handleStopEditOp,
  } = useNodeOperations({
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
  })

  const handleStopEdit = useCallback((id: string) => {
    handleStopEditOp(id, editingNodeId)
  }, [handleStopEditOp, editingNodeId])

  // Clipboard hook
  const {
    hasClipboard,
    handleCopy,
    handlePaste,
  } = useClipboard({
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
  })

  const loadParsedMd = useCallback((md: string) => {
    const parsed = mdToNodes(md, layoutMode)
    // Clean up obsolete manual positions (nodes that no longer exist)
    const validIds = new Set(parsed.map(n => n.id))
    const cleanManualPositions: Record<string, { x: number; y: number }> = {}
    for (const [id, pos] of Object.entries(manualPositions)) {
      if (validIds.has(id)) {
        cleanManualPositions[id] = pos
      }
    }
    setManualPositions(cleanManualPositions)
    
    setNodes(parsed.map((n) => ({
      id: n.id, type: 'mindMap',
      position: cleanManualPositions[n.id] || n.position,
      data: { text: n.text, level: n.level, tags: n.tags, developed: n.developed },
    })))
    setEdges(parsed.flatMap((n) =>
      n.children.map((childId) => ({
        id: `${n.id}-${childId}`, source: n.id, target: childId, type: 'mindMap',
      })),
    ))
    setSelectedNodeIds(new Set())
    setEditingNodeId(null)
    setFitViewRequested(true)
  }, [layoutMode, manualPositions])

  // Handlers de layout
  const handleLayoutChange = useCallback((mode: LayoutMode) => {
    if (mode === layoutMode) return
    
    pushHistory()

    const parsedNodes = toParsedNodes(nodesRef.current, edgesRef.current)
    const positions = applyLayout(parsedNodes, mode)

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
        data: { ...node.data, layoutMode: mode },
      }))
    )

    setLayoutMode(mode)
    markDirty()
    scheduleSave()
    setFitViewRequested(true)
  }, [layoutMode, setLayoutMode, markDirty, scheduleSave])

  const handleReorganize = useCallback(() => {
    const parsedNodes = toParsedNodes(nodesRef.current, edgesRef.current)
    const positions = applyLayout(parsedNodes, layoutMode)

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
      }))
    )

    markDirty()
    scheduleSave()
    setFitViewRequested(true)
  }, [layoutMode, markDirty, scheduleSave])

  // Handlers de paneles
  const handleToggleCollapse = useCallback((nodeId: string) => {
    toggleCollapse(nodeId)
    markDirty()
    scheduleSave()
  }, [toggleCollapse, markDirty, scheduleSave])

  const handleExpandAll = useCallback(() => {
    expandAll()
  }, [expandAll])

  const handleCollapseAll = useCallback(() => {
    // Colapsar TODOS los nodos que tienen hijos (incluyendo raíces)
    const uniqueSources = new Set<string>()
    edgesRef.current.forEach(e => uniqueSources.add(e.source))
    collapseAll(Array.from(uniqueSources))
  }, [collapseAll])

  const handleFitView = useCallback(() => {
    setFitViewRequested(true)
  }, [])

  const handleCenterSelection = useCallback(() => {
    if (selectedNodeIds.size === 1) {
      const nodeId = Array.from(selectedNodeIds)[0]
      if (nodeId) {
        const node = nodesRef.current.find(n => n.id === nodeId)
        if (node) {
          reactFlowInstance.setCenter(node.position.x, node.position.y, { duration: 500, zoom: 1 })
        }
      }
    }
  }, [selectedNodeIds, reactFlowInstance])

  const handleToggleOutline = useCallback(() => {
    setOutlineVisible(prev => !prev)
  }, [])

  const handleToggleFilters = useCallback(() => {
    setFiltersVisible(prev => !prev)
  }, [])

  const handleOpenFile = useCallback(async () => {
    if (editingNodeId) setEditingNodeId(null)
    if (dirtyRef.current) {
      if (!confirm(t('unsavedChangesConfirm'))) return
    }
    try {
      const { md, state } = await openFile()
      handleRef.current = state.fileHandle
      setFileName(state.fileName)
      dirtyRef.current = false
      setDirty(false)
      historyRef.current = []
      futureRef.current = []
      setCanUndo(false)
      setCanRedo(false)
      loadParsedMd(md)
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        console.error('Error al abrir archivo:', e)
      }
    }
  }, [editingNodeId, loadParsedMd, openFile, t])

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

  useEffect(() => {
    if (nodes.length === 0) {
      loadParsedMd(t('initialMd'))
    }
  }, [loadParsedMd, nodes.length, t])

  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: () => {
      if (selectedIdsRef.current.size > 0 && !editingNodeId) {
        handleDeleteNodes(Array.from(selectedIdsRef.current))
      }
    },
    onCopy: handleCopy,
    onPaste: handlePaste,
    onAddChild: () => {
      if (editingNodeId) return
      const first = Array.from(selectedIdsRef.current)[0]
      if (first) handleAddChild(first)
    },
    onAddSibling: () => {
      if (editingNodeId) return
      const first = Array.from(selectedIdsRef.current)[0]
      if (first) handleAddSibling(first)
    },
  })

  // Handler para cuando fitView se ejecuta
  const handleFitViewHandled = useCallback(() => {
    setFitViewRequested(false)
  }, [])

  // Nodos ocultos por colapso
  const hiddenNodeIds = useMemo(() => 
    getHiddenDescendantIds(collapsedNodeIds, edgesRef.current),
  [collapsedNodeIds, edges])

  // Qué nodos coinciden con filtros de TEXTO (solo atenuar, no ocultar)
  const matchesSearchText = useMemo(() => {
    if (!filters.searchText.trim()) return null
    const query = filters.searchText.trim().toLowerCase()
    return new Set(
      nodes.filter((node) => {
        const text = (node.data.text || '').toLowerCase()
        const tags = (node.data.tags || []).join(' ').toLowerCase()
        return text.includes(query) || tags.includes(query)
      }).map(n => n.id)
    )
  }, [nodes, filters.searchText])

  const hasSearchFilter = filters.searchText.trim().length > 0

  // Nodos visibles: ocultar colapsados, developed, y no coincidentes con tags/levels
  const visibleNodes = useMemo(() => 
    nodes.filter((node) => {
      if (hiddenNodeIds.has(node.id)) return false
      if (!showDevelopedBranches && node.data.developed === 'done') return false
      // Ocultar si no coincide con filtros de tags/levels
      if (filters.tags.length > 0) {
        const nodeTags = node.data.tags || []
        if (!filters.tags.some(tag => nodeTags.includes(tag))) return false
      }
      if (filters.levels.length > 0) {
        if (!filters.levels.includes(node.data.level)) return false
      }
      return true
    }),
  [nodes, hiddenNodeIds, showDevelopedBranches, filters.tags, filters.levels])

  // Nodos procesados: aplicar edición y atenuación por búsqueda de texto
  const processedNodes = useMemo(() =>
    visibleNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        editing: editingNodeId === node.id,
        dimmed: hasSearchFilter && matchesSearchText !== null && !matchesSearchText.has(node.id),
        showBody,
        hasChildren: edges.some(e => e.source === node.id),
        isCollapsed: collapsedNodeIds.has(node.id),
        descendantsCount: getDescendantsCount(node.id, edges),
      },
    })),
  [visibleNodes, editingNodeId, hasSearchFilter, matchesSearchText, showBody, edges, collapsedNodeIds])

  const processedEdges = useMemo(() =>
    edges.filter(edge =>
      !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target)
    ).map(edge => ({
      ...edge,
      data: { ...edge.data, layoutMode },
    })),
  [edges, hiddenNodeIds, layoutMode])

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
        fileName={fileName ? `${fileName}${dirty ? ' *' : ''}` : dirty ? t('unsaved') : null}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
      />
      <main className="flex-1 relative flex">
        {outlineVisible && (
          <div className="w-72 border-r border-border">
          <OutlinePanel
            nodes={visibleNodes}
            edges={processedEdges}
            selectedNodeId={Array.from(selectedNodeIds)[0]}
            collapsedNodeIds={collapsedNodeIds}
            onToggleCollapse={handleToggleCollapse}
            onSelectNode={(id) => setSelectedNodeIdsStable(new Set([id]))}
            onCenterNode={(id) => {
              const node = nodesRef.current.find(n => n.id === id)
              if (node) {
                reactFlowInstance.setCenter(node.position.x, node.position.y, { duration: 500, zoom: 1 })
              }
            }}
          />
          </div>
        )}
        
        {filtersVisible && (
          <div className="w-72 border-r border-border">
            <FiltersPanel
              nodes={nodes}
              filters={filters}
              onFiltersChange={(newFilters) => setFilters(newFilters)}
              onClearFilters={() => clearFilters()}
              showDevelopedBranches={showDevelopedBranches}
              onToggleShowDeveloped={() => setShowDevelopedBranches(prev => !prev)}
            />
          </div>
        )}

        <div className="flex-1 relative" ref={canvasContainerRef}>
          <Toolbar
            selectedNodeIds={selectedNodeIds}
            editingNodeId={editingNodeId}
            hasClipboard={hasClipboard}
            layoutMode={layoutMode}
            onAddRoot={handleAddRoot}
            onAddChild={() => {
              const first = Array.from(selectedNodeIds)[0]
              if (first) handleAddChild(first)
            }}
            onDelete={() => handleDeleteNodes(Array.from(selectedIdsRef.current))}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onLayoutChange={handleLayoutChange}
            onRelayout={handleReorganize}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            onToggleOutline={handleToggleOutline}
            onToggleFilters={handleToggleFilters}
            onToggleDeveloped={() => setShowDevelopedBranches(prev => !prev)}
            onFitView={handleFitView}
            onCenterSelection={handleCenterSelection}
            outlineVisible={outlineVisible}
            filtersVisible={filtersVisible}
            showDevelopedBranches={showDevelopedBranches}
            showBody={showBody}
            onToggleShowBody={() => setShowBody(prev => !prev)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExportPng={handleExportPng}
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
            onToggleCollapse={handleToggleCollapse}
          >
            <MindMapCanvas
              nodes={processedNodes}
              edges={processedEdges}
              editingNodeId={editingNodeId}
              searchQuery={filters.searchText}
              showBody={showBody}
              fitViewRequested={fitViewRequested}
              onFitViewHandled={handleFitViewHandled}
              onSelectionChange={(params: OnSelectionChangeParams) => {
                setSelectedNodeIdsStable(new Set(params.nodes.map((n) => n.id)))
              }}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onNodeDragStop={handleNodeDragStop}
            />
          </NodeCallbacksProvider>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ReactFlowProvider>
  )
}
