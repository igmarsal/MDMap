import type { Node, Edge } from 'reactflow'
import type { MindMapNodeData, DevState } from './types'

/**
 * Recalcula el estado de desarrollo (developed) de cada nodo padre
 * en función del estado de sus descendientes.
 *
 * Reglas:
 * - Hojas: conservan su propio estado.
 * - Padres: 'blocked' si ALGÚN hijo es 'blocked' (prioridad absoluta);
 *           'done' si TODOS sus hijos son 'done';
 *           'in-progress' si ALGÚN hijo es 'in-progress';
 *           en caso contrario se deja el valor actual del padre.
 *
 * Esto propaga automáticamente el estado 'blocked' hasta la raíz:
 * si cualquier nodo del árbol está bloqueado, su raíz también lo estará.
 */
export function recomputeDeveloped(
  nodes: Node<MindMapNodeData>[],
  edges: Edge[]
): Node<MindMapNodeData>[] {
  const childrenOf = new Map<string, string[]>()
  edges.forEach((e) => {
    const list = childrenOf.get(e.source) || []
    list.push(e.target)
    childrenOf.set(e.source, list)
  })

  function computeState(id: string): DevState {
    const children = childrenOf.get(id) || []
    if (children.length === 0) {
      const n = nodes.find((nd) => nd.id === id)
      return n ? n.data.developed : 'todo'
    }
    const childStates = children.map((c) => computeState(c))
    // blocked tiene prioridad absoluta
    if (childStates.some((s) => s === 'blocked')) return 'blocked'
    if (childStates.every((s) => s === 'done')) return 'done'
    if (childStates.some((s) => s === 'in-progress')) return 'in-progress'
    const n = nodes.find((nd) => nd.id === id)
    return n ? n.data.developed : 'todo'
  }

  return nodes.map((n) => {
    const children = childrenOf.get(n.id) || []
    if (children.length === 0) return n
    const newState = computeState(n.id)
    if (newState !== n.data.developed) {
      return { ...n, data: { ...n.data, developed: newState } }
    }
    return n
  })
}
