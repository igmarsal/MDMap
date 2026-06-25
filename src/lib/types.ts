/**
 * Estado de desarrollo de un nodo: pendiente, en curso o completado
 */
export type DevState = 'todo' | 'in-progress' | 'done'

/** @deprecated Usar DevState. Mantenido para compatibilidad con parsers viejos */
export function parseDevState(val: unknown): DevState {
  if (val === 'todo' || val === 'in-progress' || val === 'done') return val
  if (val === true) return 'done'
  if (val === false) return 'todo'
  return 'todo'
}

/**
 * Nodo intermedio (antes de asignar layout).
 */
export interface ParsedNode {
  id: string
  text: string
  level: number
  parent: string | null
  tags: string[]
  developed: DevState
}

/**
 * Nodo final con asignación de posición y lista de hijos.
 */
export interface MindMapNode {
  id: string
  text: string
  level: number
  parent: string | null
  children: string[]
  position: { x: number; y: number }
  tags: string[]
  developed: DevState
}

/**
 * Datos asociados a cada nodo de React Flow. Los campos `editing`, `dimmed` y
 * `showBody` son transitorios: se inyectan en el canvas y no se persisten.
 */
export interface MindMapNodeData {
  text: string
  level: number
  tags: string[]
  developed: DevState
  editing?: boolean
  dimmed?: boolean
  showBody?: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  descendantsCount?: number
  layoutMode?: LayoutMode
}

/**
 * Modos de disposición del mapa mental
 */
export type LayoutMode = 'horizontal' | 'vertical' | 'radial'

/**
 * Modos de ancho de nodo
 */
export type NodeWidthMode = 'compact' | 'normal' | 'wide'

/**
 * Constantes de modos de layout
 */
export const LAYOUT_MODES: LayoutMode[] = ['horizontal', 'vertical', 'radial']

/**
 * Configuración de ancho de nodo
 */
export const NODE_WIDTH_CONFIG = {
  compact: 200,
  normal: 240,
  wide: 320,
} as const

/**
 * Constantes de layout horizontal
 */
export const HORIZONTAL_LAYOUT = {
  levelGap: 280,
  rowGap: 90,
  rootGap: 140,
} as const

/**
 * Constantes de layout vertical
 */
export const VERTICAL_LAYOUT = {
  verticalGap: 110,
  leafWidth: 160,
  horizontalGap: 40,
  rootGap: 180,
} as const

/**
 * Constantes de layout radial
 */
export const RADIAL_LAYOUT = {
  levelRadius: 220,
  radiusIncrement: 180,
  minSiblingAngle: 30,
} as const

/**
 * Razón de cambio para historial
 */
export type HistoryReason =
  | 'add-node'
  | 'delete-node'
  | 'edit-node'
  | 'move-node'
  | 'change-layout'
  | 'collapse-node'
  | 'expand-node'
  | 'toggle-developed'
  | 'filter-developed'
  | 'paste-node'
  | 'reorganize'
  | 'markdown-import'

/**
 * Snapshot del historial
 */
export interface HistorySnapshot {
  nodes: import('reactflow').Node<MindMapNodeData>[]
  edges: import('reactflow').Edge[]
  markdown: string
  layoutMode: LayoutMode
  collapsedNodeIds: string[]
  showDevelopedBranches: boolean
  manualPositions: Record<string, { x: number; y: number }>
  timestamp: number
  reason: HistoryReason
}

/**
 * Filtros del mapa
 */
export interface MapFilters {
  searchText: string
  tags: string[]
  levels: number[]
}

/**
 * Clave especial para raíces en mapas de hijos
 */
export const ROOT_KEY = '__roots__'
