import { useEffect } from 'react'

export function useKeyboardShortcuts(handlers: {
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onAddChild?: () => void
  onAddSibling?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handlers.onSave?.()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handlers.onUndo?.()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        handlers.onRedo?.()
      }
      if (e.key === 'Delete') {
        handlers.onDelete?.()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        handlers.onCopy?.()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        handlers.onPaste?.()
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) handlers.onAddChild?.()
        else handlers.onAddSibling?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
