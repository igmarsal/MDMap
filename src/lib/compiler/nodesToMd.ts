import type { MindMapNode } from '../types'

function formatNodeText(node: MindMapNode): string[] {
  const parts = node.text.split('\n')
  // Conservamos el título vacío en vez de inyectar "Sin título" para que el
  // round-trip (abrir .md -> guardar -> abrir) sea idempotente: un nodo sin
  // título vuelve a compilar como nodo sin título.
  const firstLine = parts[0]?.trimEnd() ?? ''
  const devMark = node.developed === 'done' ? '[x]'
                : node.developed === 'in-progress' ? '[~]'
                : node.developed === 'blocked' ? '[!]'
                : '[ ]'
  const tagStr = node.tags.length > 0 ? ' ' + node.tags.map((t) => `#${t}`).join(' ') : ''
  const title = `${devMark} ${firstLine}${tagStr}`.trimEnd()
  return [title, ...parts.slice(1).map((line) => `| ${line.trimEnd()}`)]
}

export function nodesToMd(nodes: MindMapNode[]): string {
  if (nodes.length === 0) return ''

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const roots = nodes.filter((n) => n.parent === null)
  const lines: string[] = []

  function render(nodeId: string, indent: number): void {
    const node = nodeMap.get(nodeId)
    if (!node) return

    const [title, ...continuationLines] = formatNodeText(node)
    lines.push(`${'  '.repeat(indent)}- ${title}`)
    continuationLines.forEach((line) => lines.push(`${'  '.repeat(indent + 1)}${line}`))
    node.children.forEach((childId) => render(childId, indent + 1))
  }

  roots.forEach((r) => render(r.id, 0))
  return `${lines.join('\n')}\n`
}
