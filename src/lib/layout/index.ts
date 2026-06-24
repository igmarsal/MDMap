import type { ParsedNode, LayoutMode } from '../types'
import { calculateLayoutHorizontal } from './layoutHorizontal'
import { calculateLayoutVertical } from './layoutVertical'
import { calculateLayoutRadial } from './layoutRadial'
import { toParsedNodes, getHiddenDescendantIds } from './layoutUtils'

/**
 * Función principal de cálculo de layout
 * Selecciona el algoritmo apropiado según el modo
 */
export function calculateLayout(
  nodes: ParsedNode[],
  mode: LayoutMode = 'horizontal'
): Record<string, { x: number; y: number }> {
  switch (mode) {
    case 'horizontal':
      return calculateLayoutHorizontal(nodes)

    case 'vertical':
      return calculateLayoutVertical(nodes)

    case 'radial':
      return calculateLayoutRadial(nodes)

    default:
      return calculateLayoutHorizontal(nodes)
  }
}

/**
 * Aplica layout a un conjunto de nodos parseados
 * Esta función permite reaplicar layout sin reparsear Markdown
 */
export function applyLayout(
  nodes: ParsedNode[],
  mode: LayoutMode = 'horizontal'
): Record<string, { x: number; y: number }> {
  return calculateLayout(nodes, mode)
}

// Exportar utilidades
export { toParsedNodes, getHiddenDescendantIds }