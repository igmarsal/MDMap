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

/**
 * Datos asociados a cada nodo de React Flow. Los campos `editing`, `dimmed` y
 * `showBody` son transitorios: se inyectan en el canvas y no se persisten.
 */
export interface MindMapNodeData {
  text: string
  level: number
  tags: string[]
  developed: boolean
  editing?: boolean
  dimmed?: boolean
  showBody?: boolean
}
