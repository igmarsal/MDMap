import type { ParsedNode, MindMapNode } from '../types'

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function parseIndentation(line: string): { level: number; text: string; continuation: boolean } {
  const match = line.match(/^(\s*)(.+)$/)
  if (!match) return { level: 0, text: line, continuation: false }
  const tabs = match[1].replace(/\t/g, '  ').length
  const spacesPerLevel = 2
  const rawText = match[2].trim()
  const continuation = rawText.startsWith('|')
  const text = rawText.replace(/^[-*+]\s+/, '').replace(/^\|\s?/, '').trimEnd()

  return {
    level: Math.floor(tabs / spacesPerLevel),
    text,
    continuation,
  }
}

function parseTags(text: string): { text: string; tags: string[] } {
  const tags: string[] = []
  const cleaned = text.replace(/#([\p{L}\p{N}_-]+)/gu, (_, tag) => {
    tags.push(tag)
    return ''
  })
  return { text: cleaned.replace(/\s+/g, ' ').trim(), tags }
}

export function mdToNodes(md: string): MindMapNode[] {
  const lines = md.split('\n').filter((l) => l.trim().length > 0)

  const parsed: ParsedNode[] = []
  const parentStack: { level: number; id: string | null }[] = [
    { level: -1, id: null },
  ]
  const lastNodeByLevel = new Map<number, ParsedNode>()

  for (const line of lines) {
    const { level, text, continuation } = parseIndentation(line)

    if (continuation) {
      const target = lastNodeByLevel.get(level - 1)
      if (target) {
        target.text = `${target.text}\n${text}`
      }
      continue
    }

    const { text: cleanText, tags } = parseTags(text)
    const developedMatch = cleanText.match(/^\[([ x])\]\s*/)
    const developed = developedMatch ? developedMatch[1] === 'x' : false
    const finalText = developedMatch ? cleanText.slice(developedMatch[0].length) : cleanText
    const id = generateId()
    let parent: string | null = null

    while (parentStack.length > 1 && parentStack[parentStack.length - 1].level >= level) {
      parentStack.pop()
    }

    parent = parentStack[parentStack.length - 1].id
    const node = { id, text: finalText, level, parent, tags, developed }
    parsed.push(node)
    parentStack.push({ level, id })
    lastNodeByLevel.set(level, node)
  }

  const positions = calculateLayout(parsed)
  return parsed.map((p) => ({
    id: p.id,
    text: p.text,
    level: p.level,
    parent: p.parent,
    children: parsed.filter((c) => c.parent === p.id).map((c) => c.id),
    position: positions[p.id] || { x: 0, y: 0 },
    tags: p.tags,
    developed: p.developed,
  }))
}

function calculateLayout(nodes: ParsedNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const verticalGap = 100
  const leafWidth = 200
  const horizontalGap = 60

  const childrenOf = new Map<string | null, ParsedNode[]>()
  for (const node of nodes) {
    const key = node.parent ?? '__roots__'
    if (!childrenOf.has(key)) childrenOf.set(key, [])
    childrenOf.get(key)!.push(node)
  }

  function getSubtreeWidth(nodeId: string): number {
    const children = childrenOf.get(nodeId) || []
    if (children.length === 0) return leafWidth
    const total = children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0)
    return total + (children.length - 1) * horizontalGap
  }

  function placeNode(node: ParsedNode, centerX: number, depth: number) {
    positions[node.id] = { x: centerX, y: depth * verticalGap }

    const children = childrenOf.get(node.id) || []
    if (children.length === 0) return

    const widths = children.map((c) => getSubtreeWidth(c.id))
    const totalWidth = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * horizontalGap
    let startX = centerX - totalWidth / 2

    for (let i = 0; i < children.length; i++) {
      const childCenter = startX + widths[i] / 2
      placeNode(children[i], childCenter, depth + 1)
      startX += widths[i] + horizontalGap
    }
  }

  const roots = childrenOf.get('__roots__') || []
  const rootWidths = roots.map((r) => getSubtreeWidth(r.id))
  const totalRootWidth = rootWidths.reduce((a, b) => a + b, 0) + (roots.length - 1) * horizontalGap
  let rootStartX = -totalRootWidth / 2

  for (let i = 0; i < roots.length; i++) {
    const rootCenter = rootStartX + rootWidths[i] / 2
    placeNode(roots[i], rootCenter, 0)
    rootStartX += rootWidths[i] + horizontalGap
  }

  return positions
}
