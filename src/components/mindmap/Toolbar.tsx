import { Button } from '@/components/ui/Button'

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
  const isEditing = !!editingNodeId
  const hasSelection = selectedNodeIds.size > 0

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
      <Button variant="ghost" size="sm" onClick={onAddRoot} disabled={isEditing}>
        + Raíz
      </Button>
      {hasSelection && (
        <>
          <Button variant="ghost" size="sm" onClick={onAddChild} disabled={isEditing}>
            + Hijo
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopy} disabled={isEditing}>
            Copiar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isEditing} className="text-destructive hover:text-destructive">
            ✕ Borrar
          </Button>
        </>
      )}
      {hasClipboard && !isEditing && (
        <Button variant="outline" size="sm" onClick={onPaste}>
          Pegar
        </Button>
      )}
    </div>
  )
}
