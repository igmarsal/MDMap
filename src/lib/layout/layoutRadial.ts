import type { ParsedNode } from '../types'
import { ROOT_KEY } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Layout radial-híbrido: niveles 0 y 1 en círculo, niveles 2+ hacia la derecha.
 *
 * - La raíz (nivel 0) está en el centro.
 * - Los hijos directos (nivel 1) se distribuyen en un círculo alrededor de la raíz.
 * - Cada nodo de nivel 1 actúa como raíz de un subárbol que crece hacia la
 *   derecha, con los hijos apilados verticalmente y espacios generosos para
 *   evitar solapamientos.
 */
export function calculateLayoutRadial(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const childrenOf = buildChildrenMap(nodes)

  // Pre-calcular dimensiones estimadas
  const dimensions = new Map<string, { width: number; height: number }>()
  let maxNodeHeight = 0
  for (const node of nodes) {
    const dims = estimateNodeDimensions(node)
    dimensions.set(node.id, dims)
    if (dims.height > maxNodeHeight) maxNodeHeight = dims.height
  }

  // ── Constantes de espaciado ──
  // Radio del círculo para nivel 1: generoso, escalado por altura máxima
  const radialRadius = Math.max(280, maxNodeHeight * 3)

  // Espaciado horizontal para niveles 2+ (separación generosa)
  const levelGap = 320   // gap X entre niveles rightward
  const siblingGap = 35  // gap Y entre hermanos rightward

  // ──────────────────────────────────────────────
  // Funciones auxiliares para el subárbol rightward
  // ──────────────────────────────────────────────

  /** Altura total de un subárbol rightward (suma recursiva con gaps) */
  function getSubtreeHeight(nodeId: string): number {
    const children = childrenOf.get(nodeId) || []
    if (children.length === 0) return dimensions.get(nodeId)?.height ?? 60

    let total = 0
    for (let i = 0; i < children.length; i++) {
      total += getSubtreeHeight(children[i].id)
      if (i > 0) total += siblingGap
    }
    return Math.max(dimensions.get(nodeId)?.height ?? 60, total)
  }

  /** Ancho máximo por profundidad relativa en un subárbol rightward */
  function getMaxWidthsByDepth(
    nodeId: string,
    depth: number,
    acc: number[]
  ): void {
    const w = dimensions.get(nodeId)?.width ?? 240
    if (depth >= acc.length) {
      acc.push(w)
    } else {
      acc[depth] = Math.max(acc[depth], w)
    }

    for (const child of childrenOf.get(nodeId) || []) {
      getMaxWidthsByDepth(child.id, depth + 1, acc)
    }
  }

  /** Coloca un subárbol en modo rightward (niveles 2+) */
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
      (childHeights.length - 1) * siblingGap
    let startY = centerY - totalHeight / 2

    for (let i = 0; i < children.length; i++) {
      const childCenterY = startY + childHeights[i] / 2
      placeRightward(children[i], baseX, depth + 1, offsets, childCenterY)
      startY += childHeights[i] + siblingGap
    }
  }

  // ──────────────────────────────────────────────
  // Procesar todas las raíces
  // ──────────────────────────────────────────────
  const roots = childrenOf.get(ROOT_KEY) || []
  if (roots.length > 5) {
    console.warn(
      `Radial layout tiene ${roots.length} raíces. Puede haber solapes visibles.`
    )
  }

  const totalNodes = nodes.length

  for (const root of roots) {
    const children = childrenOf.get(root.id) || []

    // Colocar raíz en el centro
    positions[root.id] = { x: 0, y: 0 }

    if (children.length === 0) continue

    // ── Pre-calcular información de cada hijo de nivel 1 ──
    const childInfos = children.map((child) => {
      const maxW: number[] = []
      getMaxWidthsByDepth(child.id, 0, maxW)

      const offsets: number[] = [0]
      for (let i = 0; i < maxW.length; i++) {
        offsets.push(offsets[i] + maxW[i] + levelGap)
      }

      return {
        node: child,
        totalWidth: offsets[offsets.length - 1],
        offsets,
        subtreeH: getSubtreeHeight(child.id),
      }
    })

    // ── Distribuir hijos de nivel 1 en el círculo ──
    // Ángulo total disponible: circunferencia completa
    const totalAngle = 2 * Math.PI

    // Calcular el ángulo para cada hijo ponderado por el ancho de su subárbol
    // para evitar solapamientos: más ancho → más ángulo
    const totalWeight = childInfos.reduce((sum, info) => sum + Math.max(1, info.totalWidth), 0)

    let currentAngle = -Math.PI / 2 // empezar desde arriba

    for (let i = 0; i < childInfos.length; i++) {
      const info = childInfos[i]
      const weight = Math.max(1, info.totalWidth)
      const angleSpan = (weight / totalWeight) * totalAngle

      // Ángulo central para este hijo
      const angle = currentAngle + angleSpan / 2

      // Posición en el círculo
      const x = radialRadius * Math.cos(angle)
      const y = radialRadius * Math.sin(angle)
      positions[info.node.id] = { x, y }

      // ── Colocar subárbol rightward (niveles 2+) ──
      const grandchildren = childrenOf.get(info.node.id) || []
      if (grandchildren.length > 0) {
        const childHeights = grandchildren.map((c) => getSubtreeHeight(c.id))
        const totalChildH =
          childHeights.reduce((a, b) => a + b, 0) +
          (childHeights.length - 1) * siblingGap

        // Centrar verticalmente el subárbol rightward alrededor del nivel 1
        let startY = y - totalChildH / 2

        for (let j = 0; j < grandchildren.length; j++) {
          const childCenterY = startY + childHeights[j] / 2
          placeRightward(
            grandchildren[j],
            x,             // baseX = X del nivel 1
            1,             // profundidad relativa 1 = nivel 2 global
            info.offsets,
            childCenterY,
          )
          startY += childHeights[j] + siblingGap
        }
      }

      currentAngle += angleSpan
    }
  }

  if (totalNodes > 30) {
    console.warn(
      'Radial layout con muchos nodos. Se recomienda cambiar a horizontal para mejor legibilidad.'
    )
  }

  return positions
}
