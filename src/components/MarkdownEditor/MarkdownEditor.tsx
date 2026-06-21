import { useState, useEffect, useRef } from 'react'

interface MarkdownEditorProps {
  text: string
  onChange: (text: string) => void
  onClose: () => void
}

export default function MarkdownEditor({ text, onChange, onClose }: MarkdownEditorProps) {
  const [local, setLocal] = useState(text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocal(text)
  }, [text])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Editar nodo</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onChange(local)}
          className="w-full h-40 bg-background border border-border rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Texto del nodo..."
        />
      </div>
    </div>
  )
}
