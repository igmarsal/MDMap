export default function PreviewPanel({ markdown }: { markdown: string }) {
  return (
    <div className="h-full overflow-auto bg-card border border-border rounded-md p-4">
      <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
        {markdown || 'Vacío'}
      </pre>
    </div>
  )
}
