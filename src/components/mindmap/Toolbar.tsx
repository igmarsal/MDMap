import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n'

interface ToolbarProps {
  selectedNodeIds: Set<string>
  editingNodeId: string | null
  hasClipboard: boolean
  onAddRoot: () => void
  onAddChild: () => void
  onDelete: () => void
  onCopy: () => void
  onPaste: () => void
}

export default function Toolbar({ selectedNodeIds, editingNodeId, hasClipboard, onAddRoot, onAddChild, onDelete, onCopy, onPaste }: ToolbarProps) {
  const { t } = useI18n()
  const isEditing = !!editingNodeId
  const hasSelection = selectedNodeIds.size > 0

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
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
    </div>
  )
}
