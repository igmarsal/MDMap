import { Button } from '../ui/Button'
import { useI18n } from '../../lib/i18n'
import { LayoutList, LayoutGrid, Orbit, ArrowUpDown, RefreshCw, ChevronDown, ChevronRight, ListTree, Filter, Maximize, Crosshair, Check, Circle, Undo2, Redo2, Image } from 'lucide-react'
import type { LayoutMode } from '../../lib/types'

interface ToolbarProps {
  selectedNodeIds: Set<string>
  editingNodeId: string | null
  hasClipboard: boolean
  layoutMode: LayoutMode
  onAddRoot: () => void
  onAddChild: () => void
  onDelete: () => void
  onCopy: () => void
  onPaste: () => void
  onLayoutChange: (mode: LayoutMode) => void
  onRelayout: () => void
  onExpandAll?: () => void
  onCollapseAll?: () => void
  onToggleOutline?: () => void
  onToggleFilters?: () => void
  onFitView?: () => void
  onCenterSelection?: () => void
  outlineVisible?: boolean
  filtersVisible?: boolean
  showDevelopedBranches?: boolean
  onToggleDeveloped?: () => void
  showBody: boolean
  onToggleShowBody?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onExportPng?: () => void
}

export default function Toolbar({
  selectedNodeIds,
  editingNodeId,
  hasClipboard,
  layoutMode,
  onAddRoot,
  onAddChild,
  onDelete,
  onCopy,
  onPaste,
  onLayoutChange,
  onRelayout,
  onExpandAll,
  onCollapseAll,
  onToggleOutline,
  onToggleFilters,
  onFitView,
  onCenterSelection,
  outlineVisible = false,
  filtersVisible = false,
  showDevelopedBranches = true,
  onToggleDeveloped,
  showBody = false,
  onToggleShowBody,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onExportPng,
}: ToolbarProps) {
  const { t } = useI18n()
  const isEditing = !!editingNodeId
  const hasSelection = selectedNodeIds.size > 0

  const LayoutIcon = ({ mode }: { mode: LayoutMode }) => {
    switch (mode) {
      case 'horizontal':
        return <LayoutGrid className="h-4 w-4" />
      case 'vertical':
        return <LayoutList className="h-4 w-4" />
      case 'radial':
        return <Orbit className="h-4 w-4" />
      case 'hybrid':
        return <ArrowUpDown className="h-4 w-4" />
      default:
        return <LayoutGrid className="h-4 w-4" />
    }
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
      {/* Layout controls */}
      <div className="flex items-center gap-1" title={t('layoutMode')}>
        {(['horizontal', 'vertical', 'radial', 'hybrid'] as LayoutMode[]).map((mode) => (
          <Button
            key={mode}
            variant={layoutMode === mode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLayoutChange(mode)}
            title={t(`layout_${mode}`)}
            disabled={isEditing}
          >
            <LayoutIcon mode={mode} />
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRelayout}
          title={t('relayout')}
          disabled={isEditing}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          title="Deshacer (Ctrl+Z)"
          disabled={!canUndo || isEditing}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          title="Rehacer (Ctrl+Y)"
          disabled={!canRedo || isEditing}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      {/* View controls */}
      <div className="flex items-center gap-1">
        {onFitView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFitView}
            title={t('fitView')}
            disabled={isEditing}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        )}
        {onCenterSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCenterSelection}
            title={t('centerSelection')}
            disabled={isEditing}
          >
            <Crosshair className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Export */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExportPng}
        title={t('exportPng')}
        disabled={isEditing}
      >
        <Image className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Panels (body, developed, outline, filters) — justo después de exportar */}
      <div className="flex items-center gap-1">
        {onToggleShowBody && (
          <Button
            variant={showBody ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleShowBody}
            title={showBody ? t('hideBody') : t('showBody')}
            disabled={isEditing}
          >
            <span className="text-xs">{showBody ? '📄' : '📝'}</span>
          </Button>
        )}
        {onToggleDeveloped && (
          <Button
            variant={showDevelopedBranches ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleDeveloped}
            title={showDevelopedBranches ? t('showDeveloped') : t('hideDeveloped')}
            disabled={isEditing}
          >
            {showDevelopedBranches ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </Button>
        )}
        {onToggleOutline && (
          <Button
            variant={outlineVisible ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleOutline}
            title={outlineVisible ? t('hideOutline') : t('showOutline')}
            disabled={isEditing}
          >
            <ListTree className="h-4 w-4" />
          </Button>
        )}
        {onToggleFilters && (
          <Button
            variant={filtersVisible ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleFilters}
            title={t('filterByTag')}
            disabled={isEditing}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Node operations */}
      <Button variant="ghost" size="sm" onClick={onAddRoot} disabled={isEditing}>
        {t('addRoot')}
      </Button>
      {hasSelection && (
        <>
          <Button variant="ghost" size="sm" onClick={onAddChild} disabled={isEditing}>
            {t('addChild')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopy} disabled={isEditing}>
            {t('copy')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isEditing} className="text-destructive hover:text-destructive">
            {t('delete')}
          </Button>
        </>
      )}
      {hasClipboard && !isEditing && (
        <Button variant="outline" size="sm" onClick={onPaste}>
          {t('paste')}
        </Button>
      )}

      <div className="h-6 w-px bg-border mx-1" />

      {/* Collapse/Expand */}
      {onExpandAll && onCollapseAll && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            title={t('expandAll')}
            disabled={isEditing}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            title={t('collapseAll')}
            disabled={isEditing}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
