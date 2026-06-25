import { useState, useCallback } from 'react'
import type { LayoutMode } from '../lib/types'

/**
 * Hook para gestionar el modo de layout
 * Proporciona persistencia en localStorage y funciones para cambiar layout
 */
export function useLayoutMode() {
  const getInitialLayoutMode = (): LayoutMode => {
    let saved: LayoutMode | null = null
    try {
      saved = localStorage.getItem('mdmap_layout') as LayoutMode | null
    } catch {
      // localStorage no disponible (ej. file:// en Chrome)
    }

    if (saved === 'horizontal' || saved === 'vertical' || saved === 'radial') {
      return saved
    }

    return 'horizontal'
  }

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getInitialLayoutMode)

  const changeLayoutMode = useCallback((mode: LayoutMode) => {
    if (mode === layoutMode) return mode

    try { localStorage.setItem('mdmap_layout', mode) } catch { /* file:// no soporta localStorage */ }
    setLayoutMode(mode)
    return mode
  }, [layoutMode])

  return {
    layoutMode,
    changeLayoutMode,
    setLayoutMode,
  }
}