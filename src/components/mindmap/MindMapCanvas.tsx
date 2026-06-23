import { useMemo, useState, useCallback, useRef } from 'react'
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type OnConnect, type OnSelectionChangeParams } from 'reactflow'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'

import MindMapNode from './NodeComponent'
import MindMapEdge from './EdgeComponent'

const nodeTypes = { mindMap: MindMapNode }
const edgeTypes = { mindMap: MindMapEdge }

interface MindMapCanvasProps {
  nodes: Node[]
  edges: Edge[]
  editingNodeId: string | null
  searchQuery: string
  onSelectionChange: (params: OnSelectionChangeParams) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
}

export default function MindMapCanvas({
  nodes,
  edges,
  editingNodeId,
  searchQuery,
  onSelectionChange,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: MindMapCanvasProps) {
  const [overlayVisible, setOverlayVisible] = useState(false)
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOverlayEnter = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    setOverlayVisible(true)
  }, [])

  const handleOverlayLeave = useCallback(() => {
    overlayTimerRef.current = setTimeout(() => setOverlayVisible(false), 300)
  }, [])

  const handleNodeDoubleClick = (_: React.MouseEvent, _node: Node) => {
    // onStartEdit is handled inside NodeComponent via context
  }

  const dimmedIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return new Set<string>()
    return new Set(nodes.filter(n => {
      const text = ((n.data as any)?.text || '').toLowerCase()
      const tags = ((n.data as any)?.tags || [] as string[]).join(' ').toLowerCase()
      return !text.includes(q) && !tags.includes(q)
    }).map(n => n.id))
  }, [nodes, searchQuery])

  const processedNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      editing: editingNodeId === n.id,
      dimmed: dimmedIds.has(n.id) && searchQuery.trim().length > 0,
    },
  })), [nodes, dimmedIds, editingNodeId, searchQuery])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={processedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ type: 'mindMap' }}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        className="bg-background"
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={() => {}}
        onSelectionChange={onSelectionChange}
      >
        <Background color="#27272a" gap={20} />
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', gap: '8px',
            padding: '10px',
          }}
          onMouseEnter={handleOverlayEnter}
          onMouseLeave={handleOverlayLeave}
        >
          <div
            style={{
              opacity: overlayVisible ? 1 : 0,
              transition: 'opacity 0.2s',
              pointerEvents: overlayVisible ? 'auto' : 'none',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}
          >
            <Controls
              style={{ position: 'static', width: 'auto' }}
            />
            <MiniMap
              nodeColor={() => '#3b82f6'}
              maskColor="rgba(0,0,0,0.8)"
              style={{ position: 'static', width: 150, height: 100 }}
            />
          </div>
        </div>
      </ReactFlow>
    </div>
  )
}