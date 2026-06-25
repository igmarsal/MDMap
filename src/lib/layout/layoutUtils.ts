import type { ParsedNode, NodeDimensions } from '../types'
export type { NodeDimensions }
import { ROOT_KEY, NODE_WIDTH_CONFIG } from '../types'

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
    showBody: node.data.showBody === true,
  }))
}

/**
 * Estima las dimensiones de un nodo en función de su contenido.
 * Se usa en los algoritmos de layout para espaciar los nodos dinámicamente
 * según su tamaño real, evitando solapamientos.
 */
const NODE_WIDTH = NODE_WIDTH_CONFIG.normal // 240
const CONTENT_WIDTH = NODE_WIDTH - 30        // 210 (padding horizontal)
const TITLE_LINE_HEIGHT = 20
const TAG_LINE_HEIGHT = 16
const BODY_LINE_HEIGHT = 16
const PADDING_TOP = 12
const PADDING_BOTTOM = 8
const GAP = 4

export function estimateNodeDimensions(node: { text: string; tags: string[]; showBody?: boolean }): NodeDimensions {
  const lines = node.text.split('\n')
  const title = lines[0] || ''

  // Líneas del título (word-wrap a CONTENT_WIDTH)
  const titleCharsPerLine = Math.floor(CONTENT_WIDTH / 7.5)
  const titleLines = Math.max(1, Math.ceil(title.length / titleCharsPerLine))

  let height = PADDING_TOP + titleLines * TITLE_LINE_HEIGHT + PADDING_BOTTOM

  // Tags (si existen)
  if (node.tags && node.tags.length > 0) {
    height += GAP + TAG_LINE_HEIGHT
  }

  // Cuerpo (solo si showBody está activo)
  if (node.showBody && lines.length > 1) {
    const bodyText = lines.slice(1).join('\n').trim()
    if (bodyText) {
      const bodyCharsPerLine = Math.floor(CONTENT_WIDTH / 6.5)
      const bodyLines = Math.max(1, Math.ceil(bodyText.length / bodyCharsPerLine))
      height += GAP + bodyLines * BODY_LINE_HEIGHT
    }
  }

  // Badge de estado de desarrollo
  height += GAP + 14

  return { width: NODE_WIDTH, height }
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