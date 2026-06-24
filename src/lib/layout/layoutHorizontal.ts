import type { ParsedNode } from '../types'
import { ROOT_KEY, HORIZONTAL_LAYOUT } from '../types'
import { buildChildrenMap } from './layoutUtils'

/**
 * Calcula layout horizontal compacto
 * La raíz está a la izquierda, los hijos crecen hacia la derecha
 * El crecimiento principal es vertical, no horizontal
 */
export function calculateLayoutHorizontal(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const { levelGap, rowGap, rootGap } = HORIZONTAL_LAYOUT
  const childrenOf = buildChildrenMap(nodes)

  let currentRow = 0

  function placeNode(node: ParsedNode, depth: number): number {
    const children = childrenOf.get(node.id) || []

    if (children.length === 0) {
      const y = currentRow * rowGap
      positions[node.id] = {
        x: depth * levelGap,
        y,
      }
      currentRow++
      return y
    }

    const childYs = children.map((child) => placeNode(child, depth + 1))
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2

    positions[node.id] = {
      x: depth * levelGap,
      y,
    }

    return y
  }

  const roots = childrenOf.get(ROOT_KEY) || []

  for (const root of roots) {
    placeNode(root, 0)
    currentRow += Math.ceil(rootGap / rowGap)
  }

  return positions
}