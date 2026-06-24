import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type OnConnect, type OnSelectionChangeParams, useReactFlow, type NodeDragHandler } from 'reactflow'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'

import MindMapNode from './NodeComponent'
import MindMapEdge from './EdgeComponent'
import type { MindMapNodeData } from '../../lib/types'

const nodeTypes = { mindMap: MindMapNode }
const edgeTypes = { mindMap: MindMapEdge }

interface MindMapCanvasProps {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]
  editingNodeId: string | null
  searchQuery: string
  showBody: boolean
  fitViewRequested: boolean
  onFitViewHandled: () => void
  onSelectionChange: (params: OnSelectionChangeParams) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onNodeDragStop?: NodeDragHandler
}

export default function MindMapCanvas({
  nodes,
  edges,
  editingNodeId,
  searchQuery,
  showBody,
  fitViewRequested,
  onFitViewHandled,
  onSelectionChange,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
}: MindMapCanvasProps) {
  const reactFlowInstance = useReactFlow()
  const [overlayVisible, setOverlayVisible] = useState(false)
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // fitView controlado - sin minZoom restrictivo para permitir ver mapas grandes
  useEffect(() => {
    if (fitViewRequested && reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.3,
          duration: 300,
        })
        onFitViewHandled()
      }, 50)
    }
  }, [fitViewRequested, nodes.length, reactFlowInstance, onFitViewHandled])

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
      const text = (n.data.text || '').toLowerCase()
      const tags = (n.data.tags || []).join(' ').toLowerCase()
      return !text.includes(q) && !tags.includes(q)
    }).map(n => n.id))
  }, [nodes, searchQuery])

  const processedNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      editing: editingNodeId === n.id,
      dimmed: dimmedIds.has(n.id) && searchQuery.trim().length > 0,
      showBody,
    },
  })), [nodes, dimmedIds, editingNodeId, searchQuery, showBody])

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
        defaultEdgeOptions={{ type: 'mindMap' }}
        minZoom={0.01}
        maxZoom={4}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        className="bg-background"
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={() => {}}
        onSelectionChange={onSelectionChange}
        onNodeDragStop={onNodeDragStop}
      >
        <Background color="#71717a" gap={20} />
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