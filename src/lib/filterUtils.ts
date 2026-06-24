import type { MindMapNodeData, MapFilters } from './types'
import type { Node, Edge } from 'reactflow'

/**
 * Obtiene IDs de nodos que coinciden con los filtros activos
 */
export function getFilteredNodeIds(
  nodes: Node<MindMapNodeData>[],
  filters: MapFilters
): Set<string> {
  return new Set(
    nodes
      .filter((node) => {
        const matchesText =
          !filters.searchText ||
          node.data.text.toLowerCase().includes(filters.searchText.toLowerCase())

        const matchesTags =
          filters.tags.length === 0 ||
          filters.tags.some((tag) => node.data.tags?.includes(tag))

        const matchesLevel =
          filters.levels.length === 0 ||
          filters.levels.includes(node.data.level)

        return matchesText && matchesTags && matchesLevel
      })
      .map((node) => node.id)
  )
}

/**
 * Filtra ramas desarrolladas
 */
export function getDevelopedBranchNodeIds(nodes: Node<MindMapNodeData>[], edges: Edge[]): Set<string> {
  const developedNodeIds = new Set<string>()
  const parentByChild = new Map<string, string>()

  edges.forEach((edge) => {
    parentByChild.set(edge.target, edge.source)
  })

  function isBranchDeveloped(nodeId: string): boolean {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return false

    // Si el nodo está marcado como desarrollado
    if (node.data.developed) {
      return true
    }

    // Si es nodo desarrollado pero tiene hijos que no lo están, no contar
    const children = edges.filter((e) => e.source === nodeId)
    if (children.length > 0) {
      const allChildrenDeveloped = children.every((edge) => isBranchDeveloped(edge.target))
      return allChildrenDeveloped
    }

    return false
  }

  nodes.forEach((node) => {
    if (isBranchDeveloped(node.id)) {
      developedNodeIds.add(node.id)
    }
  })

  return developedNodeIds
}

/**
 * Calcula nodos descendientes ocultos por colapso
 */
export function getHiddenDescendantIds(
  collapsedNodeIds: Set<string>,
  edges: Edge[]
): Set<string> {
  const childrenByParent = new Map<string, string[]>()

  for (const edge of edges) {
    if (!childrenByParent.has(edge.source)) {
      childrenByParent.set(edge.source, [])
    }
    childrenByParent.get(edge.source)!.push(edge.target)
  }

  const hidden = new Set<string>()

  function hideChildren(parentId: string) {
    const children = childrenByParent.get(parentId) || []
    for (const childId of children) {
      hidden.add(childId)
      hideChildren(childId)
    }
  }

  for (const collapsedId of collapsedNodeIds) {
    hideChildren(collapsedId)
  }

  return hidden
}

/**
 * Actualiza datos de nodos con información de hijos y colapso
 */
export function updateNodesWithChildrenInfo(
  nodes: Node<MindMapNodeData>[],
  edges: Edge[],
  collapsedNodeIds: Set<string>
): Node<MindMapNodeData>[] {
  const childrenByParent = new Map<string, string[]>()
  const descendantCountByParent = new Map<string, number>()

  edges.forEach((edge) => {
    if (!childrenByParent.has(edge.source)) {
      childrenByParent.set(edge.source, [])
    }
    childrenByParent.get(edge.source)!.push(edge.target)
  })

  // Calcular descendientes para cada nodo
  function getDescendantCount(nodeId: string): number {
    if (descendantCountByParent.has(nodeId)) {
      return descendantCountByParent.get(nodeId)!
    }

    const children = childrenByParent.get(nodeId) || []
    let count = children.length

    for (const childId of children) {
      count += getDescendantCount(childId)
    }

    descendantCountByParent.set(nodeId, count)
    return count
  }

  return nodes.map((node) => {
    const children = childrenByParent.get(node.id) || []
    const isCollapsed = collapsedNodeIds.has(node.id)
    const descendantsCount = getDescendantCount(node.id)

    return {
      ...node,
      data: {
        ...node.data,
        hasChildren: children.length > 0,
        isCollapsed,
        descendantsCount,
      },
    }
  })
}