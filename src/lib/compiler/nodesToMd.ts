import type { MindMapNode } from '../types'

function formatNodeText(node: MindMapNode): string[] {
  const parts = node.text.split('\n')
  const firstLine = parts[0]?.trimEnd() || 'Sin título'
  const developedMark = node.developed ? '[x] ' : '[ ] '
  const tagStr = node.tags.length > 0 ? ' ' + node.tags.map((t) => `#${t}`).join(' ') : ''
  const title = `${developedMark}${firstLine}${tagStr}`
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
