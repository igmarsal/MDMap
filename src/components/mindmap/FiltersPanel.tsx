import { useState, useCallback, useEffect } from 'react'
import { X, Tag, Filter, Check } from 'lucide-react'
import type { MindMapNodeData, MapFilters } from '../../lib/types'
import type { Node } from 'reactflow'
import { useI18n } from '../../lib/i18n'

interface FiltersPanelProps {
  nodes: Node<MindMapNodeData>[]
  filters: MapFilters
  onFiltersChange: (filters: MapFilters) => void
  onClearFilters: () => void
  showDevelopedBranches: boolean
  onToggleShowDeveloped: () => void
}

export default function FiltersPanel({
  nodes,
  filters,
  onFiltersChange,
  onClearFilters,
  showDevelopedBranches,
  onToggleShowDeveloped,
}: FiltersPanelProps) {
  const { t } = useI18n()
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableLevels, setAvailableLevels] = useState<number[]>([])

  // Obtener tags y niveles únicos
  useEffect(() => {
    const tagsSet = new Set<string>()
    const levelsSet = new Set<number>()

    nodes.forEach((node) => {
      node.data.tags?.forEach((tag) => tagsSet.add(tag))
      levelsSet.add(node.data.level)
    })

    setAvailableTags(Array.from(tagsSet).sort())
    setAvailableLevels(Array.from(levelsSet).sort((a, b) => a - b))
  }, [nodes])

  const handleToggleTag = useCallback((tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]

    onFiltersChange({ ...filters, tags: newTags, searchText: filters.searchText })
  }, [filters, onFiltersChange])

  const handleToggleLevel = useCallback((level: number) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level]

    onFiltersChange({ ...filters, levels: newLevels, searchText: filters.searchText })
  }, [filters, onFiltersChange])

  const hasActiveFilters =
    filters.searchText !== '' ||
    filters.tags.length > 0 ||
    filters.levels.length > 0

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{t('filterByTag')}</h2>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-primary hover:text-primary/90 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-background border border-border rounded pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Filters content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Developed branches */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            {t('developed')}
          </h3>
          <button
            onClick={onToggleShowDeveloped}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${
              showDevelopedBranches
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-accent'
            }`}
          >
            <Check className="h-4 w-4" />
            {showDevelopedBranches ? t('showDeveloped') : t('hideDeveloped')}
          </button>
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              {t('filterByTag')} ({availableTags.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Levels */}
        {availableLevels.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              {t('filterByLevel')} ({availableLevels.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {availableLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleToggleLevel(level)}
                  className={`px-3 py-1 rounded text-xs border transition-colors ${
                    filters.levels.includes(level)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  {t('filterByLevel')} {level}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="p-3 border-t border-border bg-accent/30">
          <div className="text-xs text-muted-foreground mb-2">
            {t('filterByTag')}:
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.searchText && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {t('filterByLevel')}: {filters.searchText}
              </span>
            )}
            {filters.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
            {filters.levels.map((level) => (
              <span
                key={level}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
              >
                N{level}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}