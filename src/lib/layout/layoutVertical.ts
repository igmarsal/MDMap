import type { ParsedNode } from '../types'
import { ROOT_KEY } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Calcula layout vertical con espaciado dinámico.
 * La raíz está arriba, los hijos crecen hacia abajo.
 * El ancho de cada subárbol se calcula según el tamaño estimado de los nodos,
 * evitando solapamientos cuando los nodos tienen contenido variable.
 *
 * Sigue el mismo criterio que el layout horizontal: la posición vertical (Y)
 * se acumula en función de la altura máxima de los nodos en cada nivel de
 * profundidad. Cuando el cuerpo está visible los nodos son más altos y el
 * espaciado entre niveles aumenta automáticamente.
 */
export function calculateLayoutVertical(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const verticalGap = 40
  const leafWidth = 140
  const horizontalGap = 12
  const childrenOf = buildChildrenMap(nodes)

  // Pre-calcular alturas y anchos estimados de cada nodo
  const heights = new Map<string, number>()
  const widths = new Map<string, number>()
  for (const node of nodes) {
    const dims = estimateNodeDimensions(node)
    heights.set(node.id, dims.height)
    widths.set(node.id, Math.max(dims.width, leafWidth))
  }

  function getSubtreeWidth(nodeId: string): number {
    const children = childrenOf.get(nodeId) || []
    if (children.length === 0) return widths.get(nodeId) ?? leafWidth
    const total = children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0)
    return total + (children.length - 1) * horizontalGap
  }

  // ── Paso 1: recorrer el árbol y registrar la altura máxima por profundidad ──
  const maxHeightByDepth: number[] = []

  function recordDepth(nodeId: string, depth: number) {
    const h = heights.get(nodeId) ?? 60
    if (depth >= maxHeightByDepth.length) {
      maxHeightByDepth.push(h)
    } else {
      maxHeightByDepth[depth] = Math.max(maxHeightByDepth[depth], h)
    }
    const children = childrenOf.get(nodeId) || []
    for (const child of children) {
      recordDepth(child.id, depth + 1)
    }
  }

  const roots = childrenOf.get(ROOT_KEY) || []
  for (const root of roots) {
    recordDepth(root.id, 0)
  }

  // ── Calcular offset Y para cada profundidad ──
  //   yOffset[d] = Σ(maxHeightAtDepth[i] + verticalGap) para i < d
  const yOffset: number[] = [0]
  for (let i = 0; i < maxHeightByDepth.length; i++) {
    yOffset.push(yOffset[i] + maxHeightByDepth[i] + verticalGap)
  }

  // ── Paso 2: colocar nodos usando los offsets calculados ──
  function placeNode(node: ParsedNode, centerX: number, depth: number) {
    positions[node.id] = { x: centerX, y: yOffset[depth] ?? 0 }

    const children = childrenOf.get(node.id) || []
    if (children.length === 0) return

    const childWidths = children.map((c) => getSubtreeWidth(c.id))
    const totalWidth = childWidths.reduce((a, b) => a + b, 0) + (childWidths.length - 1) * horizontalGap
    let startX = centerX - totalWidth / 2

    for (let i = 0; i < children.length; i++) {
      const childCenter = startX + childWidths[i] / 2
      placeNode(children[i], childCenter, depth + 1)
      startX += childWidths[i] + horizontalGap
    }
  }

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
