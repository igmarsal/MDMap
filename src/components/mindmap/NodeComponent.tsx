import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useNodeCallbacks } from './NodeCallbacksContext'

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
  developed?: boolean
}

export default memo(function MindMapNode({ id, data, selected }: NodeProps<NodeData>) {
  const callbacks = useNodeCallbacks()
  const titleRef = useRef<HTMLInputElement>(null)
  const fullText = data.text || ''
  const parts = fullText.split('\n')
  const title = parts[0] || ''
  const body = parts.slice(1).join('\n')
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftBody, setDraftBody] = useState(body)
  const [draftTags, setDraftTags] = useState((data.tags || []).join(', '))
  const [draftDeveloped, setDraftDeveloped] = useState(!!data.developed)
  const isDimmed = (data as any).dimmed === true

  useEffect(() => {
    if (data.editing) {
      const p = (data.text || '').split('\n')
      setDraftTitle(p[0] || '')
      setDraftBody(p.slice(1).join('\n'))
      setDraftTags((data.tags || []).join(', '))
      setDraftDeveloped(!!data.developed)
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [data.editing, data.text, data.tags, data.developed])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    callbacks.onStartEdit(id)
  }, [callbacks, id])

  const acceptEdit = useCallback(() => {
    const text = (draftTitle.trim() + '\n' + draftBody).replace(/\n+$/, '').trim()
    if (text) {
      const tags = draftTags
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter((t) => t.length > 0)
      callbacks.onEdit(id, text, tags, draftDeveloped)
    } else {
      callbacks.onStopEdit(id)
    }
  }, [callbacks, draftTitle, draftBody, draftTags, draftDeveloped, id])

  const cancelEdit = useCallback(() => {
    const p = (data.text || '').split('\n')
    setDraftTitle(p[0] || '')
    setDraftBody(p.slice(1).join('\n'))
    setDraftTags((data.tags || []).join(', '))
    callbacks.onStopEdit(id)
  }, [callbacks, data.text, data.tags, id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      acceptEdit()
    }
  }, [cancelEdit, acceptEdit])

  const handleAddChild = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    callbacks.onAddChild(id)
  }, [callbacks, id])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    callbacks.onDelete(id)
  }, [callbacks, id])

  const tagColor = getTagColor(data.tags || [])
  const borderColor = tagColor || (data.developed ? '#10b981' : levelColors[Math.min(data.level ?? 0, levelColors.length - 1)])
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
        opacity: isDimmed ? 0.3 : 1,
        transition: 'opacity 0.15s',
      }}
      onDoubleClick={handleDoubleClick}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {data.editing ? (
        <div
          className="space-y-2"
          onClick={(e) => e.stopPropagation()}
          style={{ width: 'fit-content', minWidth: '180px', maxWidth: '380px' }}
        >
          <input
            ref={titleRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-background border border-border rounded p-2 text-foreground text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            placeholder="Título del nodo..."
          />
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(1, (draftBody.match(/\n/g) || []).length + 1)}
            className="w-full bg-background border border-border rounded p-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary resize-y"
            placeholder="Cuerpo del nodo (opcional)..."
          />
          <input
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-background border border-border rounded p-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            placeholder="etiquetas separadas por coma (central, importante, idea...)"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={draftDeveloped}
              onChange={(e) => setDraftDeveloped(e.target.checked)}
              className="accent-primary"
            />
            Desarrollado
          </label>
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
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-1.5">
            <span className="text-sm shrink-0 mt-0.5">{data.developed ? '✅' : '⬜'}</span>
            <div className="text-left break-words whitespace-pre-line font-semibold">{title}</div>
          </div>
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
            onClick={handleAddChild}
            className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center hover:bg-primary/90"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center hover:bg-destructive/90"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
})
