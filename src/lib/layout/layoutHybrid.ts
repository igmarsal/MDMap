import type { ParsedNode } from '../types'
import { ROOT_KEY, HYBRID_LAYOUT } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Layout híbrido (invertido): niveles 0 y 1 hacia abajo, niveles 2+ hacia la derecha.
 *
 * - La raíz (nivel 0) está arriba, sus hijos directos (nivel 1)
 *   crecen hacia abajo y se extienden horizontalmente (igual que el layout
 *   que antiguamente era «vertical» / ahora «horizontal» por disposición).
 * - Cada nodo de nivel 1 actúa como raíz de un subárbol que crece hacia
 *   la derecha, con los hijos apilados verticalmente (igual que el layout
 *   que antiguamente era «horizontal» / ahora «vertical» por disposición).
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
  // Altura de subárbol para el tramo rightward (niveles 2+):
  // se calcula recursivamente sumando la altura de los hijos
  // apilados verticalmente.
  // ──────────────────────────────────────────────
  function getSubtreeHeight(nodeId: string): number {
    const children = childrenOf.get(nodeId) || []
    if (children.length === 0) return heights.get(nodeId) ?? 60

    let total = 0
    for (let i = 0; i < children.length; i++) {
      total += getSubtreeHeight(children[i].id)
      if (i > 0) total += rightSiblingGap
    }
    return Math.max(heights.get(nodeId) ?? 60, total)
  }

  // ──────────────────────────────────────────────
  // Ancho máximo por profundidad para un subárbol rightward (niveles 2+).
  // Devuelve un array donde [d] = ancho máximo en la profundidad d
  // (profundidad 0 = el nodo raíz del subárbol rightward)
  // ──────────────────────────────────────────────
  function getMaxWidthsByDepth(
    nodeId: string,
    depth: number,
    acc: number[]
  ): void {
    const w = widths.get(nodeId) ?? 240
    if (depth >= acc.length) {
      acc.push(w)
    } else {
      acc[depth] = Math.max(acc[depth], w)
    }

    for (const child of childrenOf.get(nodeId) || []) {
      getMaxWidthsByDepth(child.id, depth + 1, acc)
    }
  }

  // ──────────────────────────────────────────────
  // Colocar un subárbol en modo rightward
  // (niveles 2+, árbol que crece hacia la derecha con hijos
  //  apilados verticalmente)
  //
  // baseX    : X izquierda del subárbol (left del nodo nivel 1)
  // depth    : profundidad relativa (0 = nivel-1, 1 = nivel-2…)
  // offsets  : X offsets para cada profundidad relativa
  // centerY  : Y donde centrar este nodo
  // ──────────────────────────────────────────────
  function placeRightward(
    node: ParsedNode,
    baseX: number,
    depth: number,
    offsets: number[],
    centerY: number,
  ): void {
    positions[node.id] = { x: baseX + offsets[depth], y: centerY }

    const children = childrenOf.get(node.id) || []
    if (children.length === 0) return

    const childHeights = children.map((c) => getSubtreeHeight(c.id))
    const totalHeight =
      childHeights.reduce((a, b) => a + b, 0) +
      (childHeights.length - 1) * rightSiblingGap
    let startY = centerY - totalHeight / 2

    for (let i = 0; i < children.length; i++) {
      const childCenterY = startY + childHeights[i] / 2
      placeRightward(children[i], baseX, depth + 1, offsets, childCenterY)
      startY += childHeights[i] + rightSiblingGap
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
    const rootW = widths.get(root.id) ?? 240

    // ── Raíz sin hijos ──
    if (children.length === 0) {
      positions[root.id] = { x: 0, y: currentY }
      currentY += rootH + rootGap
      continue
    }

    // ── Raíz con hijos ──
    // Para cada hijo de nivel 1, calcular su subárbol rightward
    const childInfos = children.map((child) => {
      const maxW: number[] = []
      getMaxWidthsByDepth(child.id, 0, maxW)

      // Calcular X offsets para cada profundidad relativa
      const offsets: number[] = [0]
      for (let i = 0; i < maxW.length; i++) {
        offsets.push(offsets[i] + maxW[i] + rightLevelGap)
      }

      return {
        node: child,
        totalWidth: offsets[offsets.length - 1],
        offsets,
        subtreeH: getSubtreeHeight(child.id),
      }
    })

    // Calcular el ancho total que ocupan todos los hijos de nivel 1
    // extendidos horizontalmente
    let totalChildrenW = 0
    for (let i = 0; i < childInfos.length; i++) {
      totalChildrenW += childInfos[i].totalWidth
      if (i < childInfos.length - 1) totalChildrenW += downSiblingGap
    }

    // Ancho total de este subárbol de raíz
    const totalW = Math.max(rootW, totalChildrenW)

    // Centrar la raíz horizontalmente y situarla arriba
    const rootCenterX = totalW / 2
    // root center Y = currentY + rootH/2 → top of root = currentY
    positions[root.id] = { x: rootCenterX, y: currentY + rootH / 2 }

    // Calcular la semi-altura máxima de los subárboles rightward
    let maxSubtreeHalf = 0
    for (const info of childInfos) {
      maxSubtreeHalf = Math.max(maxSubtreeHalf, info.subtreeH / 2)
    }

    // Posición Y de los hijos (nivel 1), centrados verticalmente
    // de modo que el borde superior del subárbol rightward más alto
    // quede a downLevelGap por debajo del borde inferior de la raíz
    const rootBottom = currentY + rootH
    const level1Y = rootBottom + downLevelGap + maxSubtreeHalf

    // Colocar hijos (nivel 1) debajo, extendidos horizontalmente
    let childX = (totalW - totalChildrenW) / 2
    for (const info of childInfos) {
      const childCenterX = childX + info.totalWidth / 2
      positions[info.node.id] = { x: childCenterX, y: level1Y }

      // Colocar el subárbol rightward (niveles 2+)
      const grandchildren = childrenOf.get(info.node.id) || []
      if (grandchildren.length > 0) {
        const childHeights = grandchildren.map((c) => getSubtreeHeight(c.id))
        const totalChildH =
          childHeights.reduce((a, b) => a + b, 0) +
          (childHeights.length - 1) * rightSiblingGap

        let startY = level1Y - totalChildH / 2
        for (let i = 0; i < grandchildren.length; i++) {
          const childCenterY = startY + childHeights[i] / 2
          placeRightward(
            grandchildren[i],
            childCenterX,
            1, // profundidad relativa 1 = nivel 2 global
            info.offsets,
            childCenterY,
          )
          startY += childHeights[i] + rightSiblingGap
        }
      }

      childX += info.totalWidth + downSiblingGap
    }

    // Altura total de la sección (desde currentY hasta el punto más bajo)
    const sectionBottom = level1Y + maxSubtreeHalf
    const totalH = sectionBottom - currentY

    currentY += totalH + rootGap
  }

  return positions
}
