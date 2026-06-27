import type { ParsedNode } from '../types'
import { ROOT_KEY, HORIZONTAL_LAYOUT } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Calcula layout horizontal compacto con espaciado dinámico.
 * La raíz está a la izquierda, los hijos crecen hacia la derecha.
 * La separación vertical se calcula según la altura estimada de cada nodo
 * para evitar solapamientos cuando los nodos tienen contenido variable.
 * Los gaps son siempre compactos; la altura del nodo varía si el cuerpo
 * está visible (estimado mediante `node.showBody` en el ParsedNode).
 */
export function calculateLayoutHorizontal(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const { levelGap } = HORIZONTAL_LAYOUT
  const rowGap = 12
  const rootGap = 20
  const childrenOf = buildChildrenMap(nodes)

  // Pre-calcular alturas estimadas de cada nodo
  const heights = new Map<string, number>()
  for (const node of nodes) {
    heights.set(node.id, estimateNodeDimensions(node).height)
  }

  let currentY = 0

  function placeNode(node: ParsedNode, depth: number): number {
    const children = childrenOf.get(node.id) || []
    const nodeHeight = heights.get(node.id) ?? 100

    if (children.length === 0) {
      const y = currentY
      positions[node.id] = {
        x: depth * levelGap,
        y,
      }
      currentY += nodeHeight + rowGap
      return y + nodeHeight / 2
    }

    const childCenters = children.map((child) => placeNode(child, depth + 1))
    const centerY = (childCenters[0] + childCenters[childCenters.length - 1]) / 2

    positions[node.id] = {
      x: depth * levelGap,
      y: centerY,
    }

    return centerY
  }

  const roots = childrenOf.get(ROOT_KEY) || []

  for (const root of roots) {
    placeNode(root, 0)
    currentY += rootGap
  }

  return positions
}
