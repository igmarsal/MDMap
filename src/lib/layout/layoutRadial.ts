import type { ParsedNode } from '../types'
import { ROOT_KEY, RADIAL_LAYOUT } from '../types'
import { buildChildrenMap } from './layoutUtils'

/**
 * Calcula layout radial
 * La raíz está en el centro, los hijos se distribuyen en radios concéntricos
 */
export function calculateLayoutRadial(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const { radiusIncrement, minSiblingAngle } = RADIAL_LAYOUT
  const childrenOf = buildChildrenMap(nodes)

  // Advertencia si hay muchas raíces
  const roots = childrenOf.get(ROOT_KEY) || []
  if (roots.length > 5) {
    console.warn(`Radial layout tiene ${roots.length} raíces. Puede haber solapes visibles.`)
  }

  // Calcular la cantidad total de nodos para detectar mapas grandes
  const totalNodes = nodes.length
  const showWarning = totalNodes > 30

  function placeNode(node: ParsedNode, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
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
    const anglePerChild = Math.max(totalAngle / children.length, (minSiblingAngle * Math.PI) / 180)
    let currentAngle = startAngle

    for (const child of children) {
      const childStartAngle = currentAngle
      const childEndAngle = currentAngle + anglePerChild
      const childCenterX = centerX + radius * Math.cos((childStartAngle + childEndAngle) / 2)
      const childCenterY = centerY + radius * Math.sin((childStartAngle + childEndAngle) / 2)

      placeNode(
        child,
        childCenterX,
        childCenterY,
        radius + radiusIncrement,
        childStartAngle,
        childEndAngle
      )

      currentAngle = childEndAngle
    }
  }

  const totalRootAngle = (2 * Math.PI) / roots.length
  let currentRootAngle = 0

  for (const root of roots) {
    placeNode(
      root,
      0,
      0,
      0,
      currentRootAngle,
      currentRootAngle + totalRootAngle
    )
    currentRootAngle += totalRootAngle
  }

  if (showWarning) {
    console.warn('Radial layout con muchos nodos. Se recomienda cambiar a horizontal para mejor legibilidad.')
  }

  return positions
}