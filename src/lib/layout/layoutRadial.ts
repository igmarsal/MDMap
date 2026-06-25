import type { ParsedNode } from '../types'
import { ROOT_KEY, RADIAL_LAYOUT } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Calcula layout radial con espaciado dinámico.
 * La raíz está en el centro, los hijos se distribuyen en radios concéntricos.
 * El radio de cada nivel y el ángulo mínimo entre hermanos se ajustan
 * según el tamaño estimado de los nodos para evitar solapamientos.
 *
 * Con nodos más grandes, el radio se incrementa para dar más espacio.
 */
export function calculateLayoutRadial(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const { radiusIncrement, minSiblingAngle } = RADIAL_LAYOUT
  const childrenOf = buildChildrenMap(nodes)

  // Pre-calcular dimensiones
  const dimensions = new Map<string, { width: number; height: number }>()
  let maxNodeSize = 0
  for (const node of nodes) {
    const dims = estimateNodeDimensions(node)
    dimensions.set(node.id, dims)
    const nodeSize = Math.max(dims.width, dims.height)
    if (nodeSize > maxNodeSize) maxNodeSize = nodeSize
  }

  // Ajustar radio según el tamaño máximo de nodo
  // El radio base es radiusIncrement, pero se escala para nodos grandes
  const dynamicRadius = Math.max(radiusIncrement, maxNodeSize * 0.8)

  const roots = childrenOf.get(ROOT_KEY) || []
  if (roots.length > 5) {
    console.warn(`Radial layout tiene ${roots.length} raíces. Puede haber solapes visibles.`)
  }

  const totalNodes = nodes.length
  const showWarning = totalNodes > 30

  function placeNode(
    node: ParsedNode,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) {
    if (radius === 0) {
      positions[node.id] = { x: 0, y: 0 }
    } else {
      const angle = (startAngle + endAngle) / 2
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    }

    const children = childrenOf.get(node.id) || []
    if (children.length === 0) return

    const totalAngle = endAngle - startAngle
    // Ángulo mínimo entre hermanos escalado por el tamaño del nodo
    const dims = dimensions.get(node.id) ?? { width: 240, height: 100 }
    const nodeSpan = Math.max(dims.width, dims.height) / 100
    const adjustedMinAngle = Math.max(minSiblingAngle * nodeSpan, minSiblingAngle)
    const anglePerChild = Math.max(
      totalAngle / children.length,
      (adjustedMinAngle * Math.PI) / 180
    )
    let currentAngle = startAngle

    for (const child of children) {
      const childStartAngle = currentAngle
      const childEndAngle = currentAngle + anglePerChild

      placeNode(
        child,
        centerX,
        centerY,
        radius + dynamicRadius,
        childStartAngle,
        childEndAngle
      )

      currentAngle = childEndAngle
    }
  }

  const totalRootAngle = (2 * Math.PI) / roots.length
  let currentRootAngle = 0

  for (const root of roots) {
    placeNode(root, 0, 0, 0, currentRootAngle, currentRootAngle + totalRootAngle)
    currentRootAngle += totalRootAngle
  }

  if (showWarning) {
    console.warn('Radial layout con muchos nodos. Se recomienda cambiar a horizontal para mejor legibilidad.')
  }

  return positions
}
