import { Button } from './ui/Button'

interface FileBarProps {
  fileName: string | null
  onOpenFile: () => void
  onOpenDirectory: () => void
  onSave: () => void
}

export default function FileBar({ fileName, onOpenFile, onOpenDirectory, onSave }: FileBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          {fileName || 'Sin archivo abierto'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onOpenFile}>
          Abrir .md
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenDirectory}>
          Abrir carpeta
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          Guardar
        </Button>
      </div>
    </header>
  )
}
