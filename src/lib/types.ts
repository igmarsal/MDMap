export interface MindMapNode {
  id: string
  text: string
  level: number
  parent: string | null
  children: string[]
  position: { x: number; y: number }
  tags: string[]
  developed: boolean
}

export interface ParsedNode {
  id: string
  text: string
  level: number
  parent: string | null
  tags: string[]
  developed: boolean
}
