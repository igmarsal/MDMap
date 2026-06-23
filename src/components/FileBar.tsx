import { Button } from './ui/Button'

interface FileBarProps {
  fileName: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onOpenFile: () => void
  onSave: () => void
}

export default function FileBar({ fileName, searchQuery, onSearchChange, onOpenFile, onSave }: FileBarProps) {
  const fileOpen = !!fileName

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2 gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {fileOpen ? (
            <>
              <span className="text-primary font-semibold mr-1">●</span>
              {fileName}
            </>
          ) : 'Sin archivo abierto'}
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar nodos..."
          className="ml-4 bg-background border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-48"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onOpenFile}>
          {fileOpen ? 'Cambiar archivo...' : 'Abrir .md'}
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          Guardar
        </Button>
      </div>
    </header>
  )
}
