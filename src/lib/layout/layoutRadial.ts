import type { ParsedNode } from '../types'
import { ROOT_KEY } from '../types'
import { buildChildrenMap, estimateNodeDimensions } from './layoutUtils'

/**
 * Calcula layout radial con espaciado dinámico.
 * La raíz está en el centro, los hijos se distribuyen en radios concéntricos.
 * El radio de cada nivel y el ángulo mínimo entre hermanos se ajustan
 * según la altura estimada de los nodos para evitar solapamientos.
 *
 * Sigue el mismo criterio que el layout horizontal: la altura del nodo
 * (que varía con showBody) determina el espacio radial y angular.
 * Con cuerpo visible los nodos son más altos → más radio y más ángulo.
 */
export function calculateLayoutRadial(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  // Espaciado generoso para que cada nodo y sus subnodos formen conjuntos
  // visualmente separados y fáciles de identificar.
  const radiusIncrement = 200
  const minSiblingAngle = 28
  const childrenOf = buildChildrenMap(nodes)

  // Pre-calcular dimensiones y altura máxima
  const dimensions = new Map<string, { width: number; height: number }>()
  let maxNodeHeight = 0
  for (const node of nodes) {
    const dims = estimateNodeDimensions(node)
    dimensions.set(node.id, dims)
    if (dims.height > maxNodeHeight) maxNodeHeight = dims.height
  }

  // Ajustar radio según la altura máxima de nodo (no el ancho, que es fijo).
  // Cuando el cuerpo está visible, la altura crece y el radio aumenta.
  const dynamicRadius = Math.max(radiusIncrement, maxNodeHeight * 1.8)

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
    // Ángulo mínimo entre hermanos escalado por la altura del nodo
    // (la altura varía con showBody; el ancho es fijo 240px y no aporta)
    const dims = dimensions.get(node.id) ?? { width: 240, height: 100 }
    const nodeSpan = dims.height / 60
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
