import { useState, useCallback, useEffect } from 'react'
import type { Node, Edge } from 'reactflow'
import type { MindMapNodeData } from '../../lib/types'

interface OutlinePanelProps {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]
  selectedNodeId?: string | null
  collapsedNodeIds: Set<string>
  onToggleCollapse: (nodeId: string) => void
  onSelectNode: (nodeId: string) => void
  onCenterNode: (nodeId: string) => void
}

import type { DevState } from '../../lib/types'

interface TreeNode {
  id: string
  text: string
  level: number
  children: TreeNode[]
  isCollapsed: boolean
  descendantsCount: number
  developed: DevState
}

export default function OutlinePanel({
  nodes,
  edges,
  selectedNodeId,
  collapsedNodeIds,
  onToggleCollapse,
  onSelectNode,
  onCenterNode,
}: OutlinePanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tree, setTree] = useState<TreeNode[]>([])

  // Construir árbol desde nodos y edges
  useEffect(() => {
    const childrenByParent = new Map<string | null, TreeNode[]>()

    // Primero, crear todos los TreeNodes
    const nodeMap = new Map<string, TreeNode>()
    for (const node of nodes) {
      const parts = (node.data.text || '').split('\n')
      const title = parts[0] || ''
      const descendantsCount = node.data.descendantsCount || 0

      nodeMap.set(node.id, {
        id: node.id,
        text: title,
        level: node.data.level,
        children: [],
        isCollapsed: collapsedNodeIds.has(node.id),
        descendantsCount,
        developed: node.data.developed || 'todo',
      })
    }

    // Luego, construir relaciones padre-hijo
    for (const edge of edges) {
      const childNode = nodeMap.get(edge.target)
      if (childNode) {
        const parentChildren = childrenByParent.get(edge.source) || []
        parentChildren.push(childNode)
        childrenByParent.set(edge.source, parentChildren)

        const parentNode = nodeMap.get(edge.source)
        if (parentNode) {
          parentNode.children.push(childNode)
        }
      }
    }

    // Obtener raíces
    const roots: TreeNode[] = []
    for (const node of nodes) {
      if (node.data.level === 0) {
        const treeNode = nodeMap.get(node.id)
        if (treeNode) {
          roots.push(treeNode)
        }
      }
    }

    setTree(roots)
  }, [nodes, edges, collapsedNodeIds])

  // Filtrar árbol por búsqueda
  const filterTree = useCallback((nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes

    const lowerQuery = query.toLowerCase()

    function filterNode(node: TreeNode): TreeNode | null {
      const matchesText = node.text.toLowerCase().includes(lowerQuery)
      const filteredChildren = node.children.map(filterNode).filter(Boolean) as TreeNode[]

      if (matchesText || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        }
      }

      return null
    }

    return nodes.map(filterNode).filter(Boolean) as TreeNode[]
  }, [])

  const filteredTree = filterTree(tree, searchQuery)

  const handleNodeClick = useCallback((nodeId: string) => {
    onSelectNode(nodeId)
    onCenterNode(nodeId)
  }, [onSelectNode, onCenterNode])

  const handleToggleCollapse = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse(nodeId)
  }, [onToggleCollapse])

  const renderTreeNode = useCallback((node: TreeNode, depth: number = 0): any => {
    const isSelected = selectedNodeId === node.id
    const padding = depth * 12

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent transition-colors ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${padding + 8}px` }}
          onClick={() => handleNodeClick(node.id)}
        >
          {/* Collapse/Expand chevron */}
          {node.children.length > 0 && (
            <button
              className="w-4 h-4 flex items-center justify-center hover:bg-accent-foreground/10 rounded"
              onClick={(e) => handleToggleCollapse(node.id, e)}
            >
              {node.isCollapsed ? (
                <span className="text-xs">▶</span>
              ) : (
                <span className="text-xs">▼</span>
              )}
            </button>
          )}

          {/* Developed indicator */}
          {node.developed === 'done' && (
            <span className="text-xs">✅</span>
          )}
          {node.developed === 'in-progress' && (
            <span className="text-xs">🟡</span>
          )}
          {node.developed === 'blocked' && (
            <span className="text-xs">🚫</span>
          )}

          {/* Node title */}
          <span className="text-sm truncate flex-1">{node.text}</span>

          {/* Descendants count */}
          {node.isCollapsed && node.descendantsCount > 0 && (
            <span className="text-xs text-muted-foreground">+{node.descendantsCount}</span>
          )}
        </div>

        {/* Render children if not collapsed */}
        {!node.isCollapsed && node.children.length > 0 && (
          <div className="border-l border-border ml-[12px]">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }, [selectedNodeId, handleNodeClick, handleToggleCollapse])

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold mb-2">Índice</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar..."
          className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTree.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {searchQuery ? 'No se encontraron resultados' : 'El mapa está vacío'}
          </div>
        ) : (
          filteredTree.map((node) => renderTreeNode(node))
        )}
      </div>
    </div>
  )
}