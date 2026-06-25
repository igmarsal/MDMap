import type { ParsedNode } from '../types'
import { ROOT_KEY } from '../types'

/**
 * Construye un mapa de hijos por padre para facilitar el cálculo de layout
 */
export function buildChildrenMap(nodes: ParsedNode[]): Map<string | null, ParsedNode[]> {
  const childrenOf = new Map<string | null, ParsedNode[]>()

  for (const node of nodes) {
    const key = node.parent ?? ROOT_KEY
    if (!childrenOf.has(key)) {
      childrenOf.set(key, [])
    }
    childrenOf.get(key)!.push(node)
  }

  return childrenOf
}

/**
 * Obtiene la profundidad de un nodo dado un mapa de padres
 */
export function getNodeDepth(nodeId: string, parentByChild: Map<string, string>): number {
  let depth = 0
  let current = parentByChild.get(nodeId)

  while (current) {
    depth++
    current = parentByChild.get(current)
  }

  return depth
}

/**
 * Obtiene el número de descendientes de un nodo
 */
export function getDescendantCount(nodeId: string, childrenByParent: Map<string, ParsedNode[]>): number {
  const children = childrenByParent.get(nodeId) || []
  let count = children.length

  for (const child of children) {
    count += getDescendantCount(child.id, childrenByParent)
  }

  return count
}

/**
 * Convierte nodos ReactFlow a ParsedNode para reaplicar layout
 */
export function toParsedNodes(
  nodes: import('reactflow').Node[],
  edges: import('reactflow').Edge[]
): ParsedNode[] {
  const parentByChild = new Map<string, string>()

  for (const edge of edges) {
    parentByChild.set(edge.target, edge.source)
  }

  return nodes.map((node) => ({
    id: node.id,
    text: node.data.text,
    level: node.data.level,
    parent: parentByChild.get(node.id) ?? null,
    tags: node.data.tags ?? [],
    developed: (node.data.developed || 'todo') as import('../types').DevState,
  }))
}

/**
 * Obtiene IDs de descendientes ocultos por colapso
 */
export function getHiddenDescendantIds(
  collapsedNodeIds: Set<string>,
  edges: import('reactflow').Edge[]
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