import type { ParsedNode, MindMapNode, LayoutMode } from '../types'
import { calculateLayout as calculateLayoutInternal } from '../layout'

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

export function mdToNodes(md: string, layoutMode: LayoutMode = 'horizontal'): MindMapNode[] {
  // Pre-filter: remove frontmatter YAML and code blocks
  const filteredLines: string[] = []
  const lines = md.split('\n')
  let inFrontmatter = false
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Detect frontmatter start (--- at the very beginning)
    if (i === 0 && trimmed === '---') {
      inFrontmatter = true
      continue
    }

    // Detect frontmatter end
    if (inFrontmatter) {
      if (trimmed === '---') {
        inFrontmatter = false
      }
      continue
    }

    // Detect code block start/end (triple backticks)
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    // Skip code block content
    if (inCodeBlock) {
      continue
    }

    // Skip empty lines
    if (trimmed.length > 0) {
      filteredLines.push(line)
    }
  }

  const parsed: ParsedNode[] = []
  const parentStack: { level: number; id: string | null }[] = [
    { level: -1, id: null },
  ]
  const lastNodeByLevel = new Map<number, ParsedNode>()

  for (const line of filteredLines) {
    const { level, text, continuation } = parseIndentation(line)

    if (continuation) {
      const target = lastNodeByLevel.get(level - 1)
      if (target) {
        target.text = `${target.text}\n${text}`
      }
      continue
    }

    const { text: cleanText, tags } = parseTags(text)
    const developedMatch = cleanText.match(/^\[([ x~])\]\s*/)
    const rawDev = developedMatch ? developedMatch[1] : null
    const developed = rawDev === 'x' ? 'done' as const
                     : rawDev === '~' ? 'in-progress' as const
                     : 'todo' as const
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

  const positions = calculateLayoutInternal(parsed, layoutMode)
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
