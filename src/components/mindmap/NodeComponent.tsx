import { memo, useRef, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

const levelColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
const tagColors: Record<string, string> = {
  central: '#ef4444',
  importante: '#f59e0b',
  urgente: '#dc2626',
  idea: '#3b82f6',
  hecho: '#10b981',
  pregunta: '#8b5cf6',
  decision: '#ec4899',
}

function getTagColor(tags: string[]): string | null {
  for (const tag of tags) {
    const color = tagColors[tag.toLowerCase()]
    if (color) return color
  }
  return null
}

interface NodeData {
  text: string
  level: number
  tags: string[]
  editing?: boolean
  onAddChild?: () => void
  onDelete?: () => void
  onEdit?: (text: string, tags: string[]) => void
  onSelect?: () => void
  onStartEdit?: () => void
  onStopEdit?: () => void
}

export default memo(function MindMapNode({ data, selected }: NodeProps<NodeData>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [draftText, setDraftText] = useState(data.text)
  const [draftTags, setDraftTags] = useState((data.tags || []).join(', '))

  useEffect(() => {
    if (data.editing) {
      setDraftText(data.text)
      setDraftTags((data.tags || []).join(', '))
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [data.editing, data.text, data.tags])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onStartEdit?.()
  }

  const acceptEdit = () => {
    const text = draftText.trim()
    if (text) {
      const tags = draftTags
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter((t) => t.length > 0)
      data.onEdit?.(draftText, tags)
    } else {
      data.onStopEdit?.()
    }
  }

  const cancelEdit = () => {
    setDraftText(data.text)
    setDraftTags((data.tags || []).join(', '))
    data.onStopEdit?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      acceptEdit()
    }
  }

  const rows = Math.max(2, (draftText.match(/\n/g) || []).length + 2)
  const tagColor = getTagColor(data.tags || [])
  const borderColor = tagColor || levelColors[Math.min(data.level ?? 0, levelColors.length - 1)]

  return (
    <div
      style={{
        background: '#18181b',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#ededed',
        fontSize: '14px',
        outline: selected ? '2px solid #3b82f6' : undefined,
        outlineOffset: '2px',
      }}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation()
        data.onSelect?.()
      }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {data.editing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            className="w-full bg-background border border-border rounded p-2 text-foreground outline-none focus:ring-2 focus:ring-primary resize-y"
            placeholder="Texto del nodo..."
          />
          <input
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-background border border-border rounded p-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            placeholder="etiquetas separadas por coma (central, importante, idea...)"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={acceptEdit}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Aceptar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-left break-words whitespace-pre-line">{data.text}</div>
          {(data.tags || []).length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: tagColors[tag.toLowerCase()] || '#6b7280',
                    color: '#ffffff',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-border" />

      {selected && !data.editing && (
        <div className="absolute -top-3 -right-3 flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onAddChild?.()
            }}
            className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center hover:bg-primary/90"
          >
            +
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onDelete?.()
            }}
            className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center hover:bg-destructive/90"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
})
