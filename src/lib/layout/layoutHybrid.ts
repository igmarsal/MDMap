import type { ParsedNode } from '../types'
import { ROOT_KEY, HYBRID_LAYOUT } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Layout híbrido: niveles 0 y 1 hacia la derecha, niveles 2+ hacia abajo.
 *
 * - La raíz (nivel 0) está a la izquierda, sus hijos directos (nivel 1)
 *   crecen hacia la derecha y se apilan verticalmente (igual que el layout
 *   que antiguamente era «horizontal» / ahora «vertical» por disposición).
 * - Cada nodo de nivel 1 actúa como raíz de un subárbol que crece hacia
 *   abajo, con los hijos extendidos horizontalmente (igual que el layout
 *   que antiguamente era «vertical» / ahora «horizontal» por disposición).
 */
export function calculateLayoutHybrid(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const {
    rightLevelGap,
    rightSiblingGap,
    downLevelGap,
    downSiblingGap,
    rootGap,
  } = HYBRID_LAYOUT

  const childrenOf = buildChildrenMap(nodes)

  // Pre-calcular dimensiones estimadas
  const heights = new Map<string, number>()
  const widths = new Map<string, number>()
  for (const node of nodes) {
    const dims = estimateNodeDimensions(node)
    heights.set(node.id, dims.height)
    widths.set(node.id, Math.max(dims.width, 140))
  }

  // ──────────────────────────────────────────────
  // Ancho de subárbol para el tramo downward (niveles 2+):
  // se calcula recursivamente sumando el ancho de los hijos
  // extendidos horizontalmente.
  // ──────────────────────────────────────────────
  function getSubtreeWidth(nodeId: string): number {
    const children = childrenOf.get(nodeId) || []
    if (children.length === 0) return widths.get(nodeId) ?? 240

    let total = 0
    for (let i = 0; i < children.length; i++) {
      total += getSubtreeWidth(children[i].id)
      if (i > 0) total += downSiblingGap
    }
    return Math.max(widths.get(nodeId) ?? 240, total)
  }

  // ──────────────────────────────────────────────
  // Altura máxima por profundidad para un subárbol downward
  // Devuelve un array donde [d] = altura máxima en la profundidad d
  // (profundidad 0 = el nodo raíz del subárbol downward)
  // ──────────────────────────────────────────────
  function getMaxHeightsByDepth(
    nodeId: string,
    depth: number,
    acc: number[]
  ): void {
    const h = heights.get(nodeId) ?? 60
    if (depth >= acc.length) {
      acc.push(h)
    } else {
      acc[depth] = Math.max(acc[depth], h)
    }

    for (const child of childrenOf.get(nodeId) || []) {
      getMaxHeightsByDepth(child.id, depth + 1, acc)
    }
  }

  // ──────────────────────────────────────────────
  // Colocar un subárbol en modo downward
  // (niveles 2+, árbol que crece hacia abajo con hijos
  //  extendidos horizontalmente)
  //
  // baseY    : Y superior del subárbol (top del nodo nivel 1)
  // depth    : profundidad relativa (0 = nivel-1, 1 = nivel-2...)
  // offsets  : Y offsets para cada profundidad relativa
  // centerX  : X donde centrar este nodo
  // ──────────────────────────────────────────────
  function placeDownward(
    node: ParsedNode,
    baseY: number,
    depth: number,
    offsets: number[],
    centerX: number,
  ): void {
    positions[node.id] = { x: centerX, y: baseY + offsets[depth] }

    const children = childrenOf.get(node.id) || []
    if (children.length === 0) return

    const childWidths = children.map((c) => getSubtreeWidth(c.id))
    const totalWidth =
      childWidths.reduce((a, b) => a + b, 0) +
      (childWidths.length - 1) * downSiblingGap
    let startX = centerX - totalWidth / 2

    for (let i = 0; i < children.length; i++) {
      const childCenterX = startX + childWidths[i] / 2
      placeDownward(children[i], baseY, depth + 1, offsets, childCenterX)
      startX += childWidths[i] + downSiblingGap
    }
  }

  // ──────────────────────────────────────────────
  // Procesar todas las raíces
  // ──────────────────────────────────────────────
  const roots = childrenOf.get(ROOT_KEY) || []
  let currentY = 0

  for (const root of roots) {
    const children = childrenOf.get(root.id) || []
    const rootH = heights.get(root.id) ?? 100

    // ── Raíz sin hijos ──
    if (children.length === 0) {
      positions[root.id] = { x: 0, y: currentY }
      currentY += rootH + rootGap
      continue
    }

    // ── Raíz con hijos ──
    // Para cada hijo de nivel 1, calcular su subárbol downward
    const childInfos = children.map((child) => {
      const maxH: number[] = []
      getMaxHeightsByDepth(child.id, 0, maxH)

      // Calcular Y offsets para cada profundidad
      const offsets: number[] = [0]
      for (let i = 0; i < maxH.length; i++) {
        offsets.push(offsets[i] + maxH[i] + downLevelGap)
      }

      return {
        node: child,
        totalHeight: offsets[offsets.length - 1],
        offsets,
      }
    })

    // Calcular la altura total que ocupan todos los hijos apilados verticalmente
    let totalChildrenH = 0
    for (let i = 0; i < childInfos.length; i++) {
      totalChildrenH += childInfos[i].totalHeight
      if (i < childInfos.length - 1) totalChildrenH += rightSiblingGap
    }

    // Altura total de este subárbol de raíz
    const totalH = Math.max(rootH, totalChildrenH)

    // Centrar la raíz verticalmente entre sus hijos
    const rootCenterY = currentY + totalH / 2
    positions[root.id] = { x: 0, y: rootCenterY }

    // Colocar hijos (nivel 1) a la derecha, apilados verticalmente
    let childY = currentY
    for (const info of childInfos) {
      // Colocar el nodo de nivel 1
      positions[info.node.id] = { x: rightLevelGap, y: childY }

      // Colocar el subárbol downward (niveles 2+)
      const l1Children = childrenOf.get(info.node.id) || []
      if (l1Children.length > 0) {
        const childW = l1Children.map((c) => getSubtreeWidth(c.id))
        const totalW =
          childW.reduce((a, b) => a + b, 0) +
          (childW.length - 1) * downSiblingGap
        let startX = rightLevelGap - totalW / 2

        for (let i = 0; i < l1Children.length; i++) {
          const childCenterX = startX + childW[i] / 2
          placeDownward(
            l1Children[i],
            childY,
            1,              // profundidad relativa 1 = nivel 2 global
            info.offsets,
            childCenterX,
          )
          startX += childW[i] + downSiblingGap
        }
      }

      childY += info.totalHeight + rightSiblingGap
    }

    currentY += totalH + rootGap
  }

  return positions
}
