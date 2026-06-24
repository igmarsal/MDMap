import { useState, useCallback } from 'react'
import type { MapFilters } from '../lib/types'

/**
 * Hook para gestionar filtros del mapa
 */
export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>({
    searchText: '',
    tags: [],
    levels: [],
  })

  const setSearchText = useCallback((text: string) => {
    setFilters((prev) => ({ ...prev, searchText: text }))
  }, [])

  const addTagFilter = useCallback((tag: string) => {
    setFilters((prev) => {
      if (prev.tags.includes(tag)) return prev
      return { ...prev, tags: [...prev.tags, tag] }
    })
  }, [])

  const removeTagFilter = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }, [])

  const addLevelFilter = useCallback((level: number) => {
    setFilters((prev) => {
      if (prev.levels.includes(level)) return prev
      return { ...prev, levels: [...prev.levels, level] }
    })
  }, [])

  const removeLevelFilter = useCallback((level: number) => {
    setFilters((prev) => ({
      ...prev,
      levels: prev.levels.filter((l) => l !== level),
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      searchText: '',
      tags: [],
      levels: [],
    })
  }, [])

  const hasActiveFilters = useCallback(() => {
    return filters.searchText !== '' || filters.tags.length > 0 || filters.levels.length > 0
  }, [filters.searchText, filters.tags.length, filters.levels.length])

  return {
    filters,
    setFilters,
    setSearchText,
    addTagFilter,
    removeTagFilter,
    addLevelFilter,
    removeLevelFilter,
    clearFilters,
    hasActiveFilters,
  }
}