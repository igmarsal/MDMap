import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useNodeCallbacks } from './NodeCallbacksContext'
import type { MindMapNodeData } from '../../lib/types'
import { useI18n } from '../../lib/i18n'
import { NODE_WIDTH_CONFIG } from '../../lib/types'

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

function areNodePropsEqual(prev: NodeProps<MindMapNodeData>, next: NodeProps<MindMapNodeData>) {
  return prev.id === next.id &&
    prev.selected === next.selected &&
    prev.data.text === next.data.text &&
    prev.data.level === next.data.level &&
    prev.data.developed === next.data.developed &&
    prev.data.editing === next.data.editing &&
    prev.data.dimmed === next.data.dimmed &&
    prev.data.showBody === next.data.showBody &&
    prev.data.isCollapsed === next.data.isCollapsed &&
    prev.data.hasChildren === next.data.hasChildren &&
    prev.data.descendantsCount === next.data.descendantsCount &&
    JSON.stringify(prev.data.tags) === JSON.stringify(next.data.tags)
}

export default memo(function MindMapNode({ id, data, selected }: NodeProps<MindMapNodeData>) {
  const { t } = useI18n()
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
  const isDimmed = data.dimmed === true
  const hasChildren = data.hasChildren ?? false
  const isCollapsed = data.isCollapsed ?? false
  const descendantsCount = data.descendantsCount ?? 0

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

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    callbacks.onToggleCollapse?.(id)
  }, [callbacks, id])

  const tagColor = getTagColor(data.tags || [])
  const borderColor = tagColor || (data.developed ? '#10b981' : levelColors[Math.min(data.level ?? 0, levelColors.length - 1)])

  const NODE_WIDTH = NODE_WIDTH_CONFIG.normal
  const CONTENT_WIDTH = NODE_WIDTH - 30 // padding and borders
  return (
    <div
      style={{
        width: NODE_WIDTH,
        maxWidth: NODE_WIDTH,
        background: 'var(--color-card)',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '8px 12px',
        color: 'var(--color-card-foreground)',
        fontSize: '14px',
        outline: selected ? '2px solid var(--color-primary)' : undefined,
        outlineOffset: '2px',
        opacity: isDimmed ? 0.3 : 1,
        transition: 'opacity 0.15s',
      }}
      onDoubleClick={handleDoubleClick}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {/* Collapse/Expand button */}
      {hasChildren && !data.editing && (
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border border-border hover:bg-accent flex items-center justify-center"
          title={isCollapsed ? t('expandBranch') : t('collapseBranch')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}

      {/* Descendants count indicator */}
      {isCollapsed && descendantsCount > 0 && !data.editing && (
        <div className="absolute -right-7 top-1/2 -translate-y-1/2 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1.5 shadow-sm border border-background">
          +{descendantsCount}
        </div>
      )}

       {data.editing ? (
        <div
          className="space-y-2"
          onClick={(e) => e.stopPropagation()}
          style={{ width: 'fit-content', minWidth: '180px', maxWidth: CONTENT_WIDTH }}
        >
          <input
            ref={titleRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-background border border-border rounded p-2 text-foreground text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            placeholder={t('nodeTitlePlaceholder')}
          />
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(1, (draftBody.match(/\n/g) || []).length + 1)}
            className="w-full bg-background border border-border rounded p-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary resize-y"
            placeholder={t('nodeBodyPlaceholder')}
          />
          <input
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-background border border-border rounded p-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            placeholder={t('nodeTagsPlaceholder')}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={draftDeveloped}
              onChange={(e) => setDraftDeveloped(e.target.checked)}
              className="accent-primary"
            />
            {t('developed')}
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {t('cancelAction')}
            </button>
            <button
              type="button"
              onClick={acceptEdit}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              {t('acceptAction')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-1.5">
            <span className="text-sm shrink-0 mt-0.5">{data.developed ? '✅' : '⬜'}</span>
            <div className="text-left break-words whitespace-pre-line font-semibold max-w-[210px]">{title}</div>
          </div>
          {data.showBody && body.trim().length > 0 && (
            <div className="text-left break-words whitespace-pre-line text-xs text-muted-foreground mt-1 max-w-[210px]">{body}</div>
          )}
          {(data.tags || []).length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: tagColors[tag.toLowerCase()] || 'var(--color-muted-foreground)',
                    color: '#ffffff',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* Developed label */}
          {data.developed && !data.editing && (
            <div className="text-[9px] text-muted-foreground text-center mt-1">
              {t('developedLabel')}
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
}, areNodePropsEqual)
