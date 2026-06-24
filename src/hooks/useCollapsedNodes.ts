import { useState, useCallback, useEffect } from 'react'

/**
 * Hook para gestionar el colapso/expansión de ramas
 * Proporciona persistencia en localStorage
 */
export function useCollapsedNodes() {
  const getInitialCollapsedNodes = (): Set<string> => {
    try {
      const saved = localStorage.getItem('mdmap_collapsed_nodes')
      if (saved) {
        const parsed = JSON.parse(saved)
        return new Set(parsed)
      }
    } catch (e) {
      console.error('Error al cargar nodos colapsados:', e)
    }
    return new Set()
  }

  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(getInitialCollapsedNodes)

  // Guardar cambios en localStorage
  useEffect(() => {
    localStorage.setItem('mdmap_collapsed_nodes', JSON.stringify(Array.from(collapsedNodeIds)))
  }, [collapsedNodeIds])

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const collapseNode = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      next.add(nodeId)
      return next
    })
  }, [])

  const expandNode = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      next.delete(nodeId)
      return next
    })
  }, [])

  const collapseAll = useCallback((nodeIdsToCollapse: string[] = []) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      for (const nodeId of nodeIdsToCollapse) {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setCollapsedNodeIds(new Set())
  }, [])

  const cleanupObsoleteNodes = useCallback((existingNodeIds: Set<string>) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set<string>()
      for (const nodeId of prev) {
        if (existingNodeIds.has(nodeId)) {
          next.add(nodeId)
        }
      }
      return next
    })
  }, [])

  return {
    collapsedNodeIds,
    toggleCollapse,
    collapseNode,
    expandNode,
    collapseAll,
    expandAll,
    cleanupObsoleteNodes,
  }
}