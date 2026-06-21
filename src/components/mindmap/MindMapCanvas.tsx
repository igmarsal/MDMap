import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type OnConnect } from 'reactflow'
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
  onSelectNode: (id: string) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onAddChild: (parentId: string) => void
  onDeleteNode: (id: string) => void
  onEditNode: (id: string, text: string, tags: string[]) => void
  onStartEdit: (id: string) => void
  onStopEdit: () => void
}

export default function MindMapCanvas({
  nodes,
  edges,
  editingNodeId,
  onSelectNode,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddChild,
  onDeleteNode,
  onEditNode,
  onStartEdit,
  onStopEdit,
}: MindMapCanvasProps) {
  const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
    onStartEdit(node.id)
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            onAddChild: () => onAddChild(n.id),
            onDelete: () => onDeleteNode(n.id),
            onEdit: (text: string, tags: string[]) => onEditNode(n.id, text, tags),
            onSelect: () => onSelectNode(n.id),
            onStartEdit: () => onStartEdit(n.id),
            onStopEdit,
            editing: editingNodeId === n.id,
          },
        }))}
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
        className="bg-background"
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={() => onStopEdit()}
      >
        <Background color="#27272a" gap={20} />
        <Controls />
        <MiniMap nodeColor={() => '#3b82f6'} maskColor="rgba(0,0,0,0.8)" />
      </ReactFlow>
    </div>
  )
}
