import type { ParsedNode } from '../types'
import { ROOT_KEY, VERTICAL_LAYOUT } from '../types'
import { buildChildrenMap } from './layoutUtils'

/**
 * Calcula layout vertical mejorado (más compacto que el actual)
 * La raíz está arriba, los hijos crecen hacia abajo
 */
export function calculateLayoutVertical(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const { verticalGap, leafWidth, horizontalGap } = VERTICAL_LAYOUT
  const childrenOf = buildChildrenMap(nodes)

  function getSubtreeWidth(nodeId: string): number {
    const children = childrenOf.get(nodeId) || []
    if (children.length === 0) return leafWidth
    const total = children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0)
    return total + (children.length - 1) * horizontalGap
  }

  function placeNode(node: ParsedNode, centerX: number, depth: number) {
    positions[node.id] = { x: centerX, y: depth * verticalGap }

    const children = childrenOf.get(node.id) || []
    if (children.length === 0) return

    const widths = children.map((c) => getSubtreeWidth(c.id))
    const totalWidth = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * horizontalGap
    let startX = centerX - totalWidth / 2

    for (let i = 0; i < children.length; i++) {
      const childCenter = startX + widths[i] / 2
      placeNode(children[i], childCenter, depth + 1)
      startX += widths[i] + horizontalGap
    }
  }

  const roots = childrenOf.get(ROOT_KEY) || []
  const rootWidths = roots.map((r) => getSubtreeWidth(r.id))
  const totalRootWidth = rootWidths.reduce((a, b) => a + b, 0) + (roots.length - 1) * horizontalGap
  let rootStartX = -totalRootWidth / 2

  for (let i = 0; i < roots.length; i++) {
    const rootCenter = rootStartX + rootWidths[i] / 2
    placeNode(roots[i], rootCenter, 0)
    rootStartX += rootWidths[i] + horizontalGap
  }

  return positions
}