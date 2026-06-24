import { useState, useCallback } from 'react'
import type { LayoutMode } from '../lib/types'

/**
 * Hook para gestionar el modo de layout
 * Proporciona persistencia en localStorage y funciones para cambiar layout
 */
export function useLayoutMode() {
  const getInitialLayoutMode = (): LayoutMode => {
    const saved = localStorage.getItem('mdmap_layout') as LayoutMode | null

    if (saved === 'horizontal' || saved === 'vertical' || saved === 'radial') {
      return saved
    }

    return 'horizontal'
  }

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getInitialLayoutMode)

  const changeLayoutMode = useCallback((mode: LayoutMode) => {
    if (mode === layoutMode) return mode

    localStorage.setItem('mdmap_layout', mode)
    setLayoutMode(mode)
    return mode
  }, [layoutMode])

  return {
    layoutMode,
    changeLayoutMode,
    setLayoutMode,
  }
}