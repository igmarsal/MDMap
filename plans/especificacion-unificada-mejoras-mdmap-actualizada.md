# Especificación funcional y técnica unificada: Mejora de disposición y navegación del mapa mental

**Proyecto:** MDMap  
**Versión objetivo:** 0.4.0  
**Estado:** Lista para implementación  
**Prioridad:** Alta  
**Objetivo principal:** Mejorar la usabilidad del mapa mental cuando contiene muchos nodos, evitando mapas excesivamente anchos, zooms inútiles y pérdida de contexto visual.

---

# 1. Contexto y problema actual

La aplicación MDMap genera actualmente mapas mentales a partir de Markdown. El problema aparece cuando el documento contiene muchos elementos, especialmente muchos nodos hermanos o muchas hojas al mismo nivel.

El algoritmo actual de disposición calcula el ancho de cada subárbol sumando el ancho de sus hojas. Esto provoca que el mapa crezca de forma desproporcionada en horizontal. En mapas grandes, ReactFlow intenta encajar todo el contenido con `fitView`, lo que aleja tanto la vista que los nodos dejan de ser legibles.

El resultado actual es:

- Mapas excesivamente anchos.
- Zoom inicial demasiado alejado.
- Nodos difíciles de leer.
- Pérdida de contexto.
- Dificultad para trabajar con mapas grandes.
- Falta de mecanismos para ocultar ramas no relevantes.
- Ausencia de una navegación rápida tipo índice.
- Reorganización poco eficiente al añadir nodos.

La solución propuesta consiste en introducir varios modos de disposición, mejorar el layout por defecto, añadir plegado/desplegado de ramas, fijar dimensiones de nodos, mejorar la gestión del zoom y añadir herramientas de navegación y filtrado.

---

# 2. Objetivos

## 2.1 Objetivos funcionales

La aplicación deberá permitir:

1. Cambiar entre distintos modos de disposición del mapa.
2. Usar por defecto un layout horizontal compacto, más adecuado para mapas grandes.
3. Reorganizar el mapa manualmente mediante una acción explícita.
4. Plegar y desplegar ramas del mapa.
5. Mantener nodos con anchura visual controlada.
6. Evitar que `fitView` aleje excesivamente la vista de forma automática.
7. Navegar por el mapa mediante un panel lateral tipo índice.
8. Filtrar o resaltar nodos por texto, tags o nivel.
9. Persistir preferencias de layout entre sesiones.
10. Mantener intacto el Markdown original, los textos, las relaciones y los tags al cambiar de disposición.

## 2.2 Objetivos técnicos

La implementación deberá:

1. Refactorizar el cálculo de layout en funciones independientes.
2. Añadir un tipo `LayoutMode`.
3. Separar el parseo Markdown del cálculo de posiciones.
4. Permitir reaplicar layout sin reparsear el documento.
5. Mantener compatibilidad con ReactFlow.
6. Evitar introducir librerías externas de layout en esta fase.
7. Mantener una arquitectura extensible para futuros layouts.
8. Reducir el riesgo de solapes y mapas inabarcables.

---

# 3. Alcance de la mejora

Esta especificación incluye:

- Modo de layout horizontal.
- Modo de layout vertical mejorado.
- Modo de layout radial.
- Selector de layout en toolbar.
- Persistencia del modo seleccionado.
- Acción manual “Reorganizar mapa”.
- Plegado/desplegado de ramas.
- Nodos con anchura fija o limitada.
- Gestión mejorada de `fitView`.
- Panel lateral de navegación jerárquica.
- Filtros por búsqueda, tags y niveles.
- Adaptación de creación de nodos al layout activo.
- Criterios de aceptación funcionales y técnicos.

No incluye en esta fase:

- Layout automático con librerías externas como Dagre, ELK o D3.
- Edición colaborativa.
- Sincronización remota.
- Auto-layout inteligente por IA.
- Persistencia estructurada en base de datos.
- Animaciones complejas de transición entre layouts.

---

# 4. Modos de disposición del mapa

Se implementarán tres modos principales de layout:

```ts
export type LayoutMode = 'horizontal' | 'vertical' | 'radial'
```

---

# 5. Modo A — Horizontal compacto

## 5.1 Identificador

```ts
layout: 'horizontal'
```

## 5.2 Descripción

Será el modo predeterminado.

La raíz se colocará a la izquierda. Los hijos se desplegarán hacia la derecha, nivel a nivel. El crecimiento principal será vertical, no horizontal.

Este layout es el más adecuado para mapas grandes porque evita que muchos nodos hermanos ensanchen el mapa de forma excesiva.

## 5.3 Ejemplo visual

```text
[Raíz] ─── [Hijo 1] ─── [Nieto 1.1]
       │              └── [Nieto 1.2]
       └── [Hijo 2] ─── [Nieto 2.1]
                      └── [Nieto 2.2]
```

## 5.4 Parámetros recomendados

```ts
const HORIZONTAL_LAYOUT = {
  levelGap: 280,
  rowGap: 90,
  rootGap: 140,
}
```

## 5.5 Reglas de posicionamiento

- `x = depth * levelGap`.
- Los nodos hoja se colocan en filas consecutivas.
- Los nodos padre se centran verticalmente respecto a sus hijos.
- Las múltiples raíces se apilan verticalmente.
- Debe evitarse que el mapa crezca innecesariamente en horizontal.

## 5.6 Algoritmo propuesto

```ts
function calculateLayoutHorizontal(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  const levelGap = 280
  const rowGap = 90
  const rootGap = 140

  const childrenOf = buildChildrenMap(nodes)

  let currentRow = 0

  function placeNode(node: ParsedNode, depth: number): number {
    const children = childrenOf.get(node.id) || []

    if (children.length === 0) {
      const y = currentRow * rowGap
      positions[node.id] = {
        x: depth * levelGap,
        y,
      }
      currentRow++
      return y
    }

    const childYs = children.map((child) => placeNode(child, depth + 1))
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2

    positions[node.id] = {
      x: depth * levelGap,
      y,
    }

    return y
  }

  const roots = childrenOf.get(ROOT_KEY) || []

  for (const root of roots) {
    placeNode(root, 0)
    currentRow += Math.ceil(rootGap / rowGap)
  }

  return positions
}
```

---

# 6. Modo B — Vertical mejorado

## 6.1 Identificador

```ts
layout: 'vertical'
```

## 6.2 Descripción

La raíz queda en la parte superior y los hijos se despliegan hacia abajo.

Es similar al modo actual, pero con parámetros más compactos para reducir el ancho total del mapa.

## 6.3 Ejemplo visual

```text
          [Raíz]
         /       \
    [Hijo 1]   [Hijo 2]
     /   \          \
[N 1.1] [N 1.2]   [N 2.1]
```

## 6.4 Parámetros recomendados

```ts
const VERTICAL_LAYOUT = {
  verticalGap: 110,
  leafWidth: 160,
  horizontalGap: 40,
  rootGap: 180,
}
```

## 6.5 Reglas de posicionamiento

- La profundidad se representa en el eje Y.
- Los hermanos se distribuyen horizontalmente.
- Cada padre queda centrado respecto a sus hijos.
- Debe ser más compacto que el layout actual.
- Es útil para mapas pequeños o con pocos niveles de profundidad.

---

# 7. Modo C — Radial

## 7.1 Identificador

```ts
layout: 'radial'
```

## 7.2 Descripción

La raíz se sitúa en el centro. Los hijos se distribuyen alrededor en forma circular o semicircular, usando radios crecientes por nivel.

Este modo es útil para mapas equilibrados y visualmente exploratorios, pero no debe ser el modo recomendado para mapas muy grandes o muy asimétricos.

## 7.3 Ejemplo visual

```text
        [Nieto 1.1]
          /
     [Hijo 1]
        \
         [Nieto 1.2]

[Raíz]

     [Hijo 2] ─── [Nieto 2.1]
```

## 7.4 Parámetros recomendados

```ts
const RADIAL_LAYOUT = {
  levelRadius: 220,
  radiusIncrement: 180,
  minSiblingAngle: 30,
}
```

## 7.5 Reglas de posicionamiento

- La raíz se coloca en `{ x: 0, y: 0 }`.
- Los hijos directos se reparten en un arco de 360°.
- Los niveles posteriores usan radios incrementales.
- Cada subárbol debe ocupar un sector angular.
- Si hay múltiples raíces, cada raíz ocupa un sector separado.
- Si hay más de 5 raíces, se debe lanzar una advertencia por consola, sin bloquear la operación.

## 7.6 Limitaciones conocidas

- Puede generar solapes en mapas muy asimétricos.
- No debe ser el layout por defecto.
- Si el mapa tiene más de 30 nodos y hay solapes evidentes, se recomienda mostrar aviso visual o sugerir cambiar al modo horizontal.

---

# 8. Tipo `LayoutMode`

## 8.1 Archivo afectado

```text
src/lib/types.ts
```

## 8.2 Cambio requerido

Añadir:

```ts
export type LayoutMode = 'horizontal' | 'vertical' | 'radial'
```

Opcionalmente, añadir constantes reutilizables:

```ts
export const LAYOUT_MODES: LayoutMode[] = [
  'horizontal',
  'vertical',
  'radial',
]
```

---

# 9. Refactor de cálculo de layout

## 9.1 Archivo afectado

```text
src/lib/parser/mdToNodes.ts
```

## 9.2 Cambio de firma

Antes:

```ts
function calculateLayout(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }>
```

Después:

```ts
function calculateLayout(
  nodes: ParsedNode[],
  mode: LayoutMode
): Record<string, { x: number; y: number }>
```

## 9.3 Funciones privadas

```ts
function calculateLayoutHorizontal(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }>

function calculateLayoutVertical(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }>

function calculateLayoutRadial(
  nodes: ParsedNode[]
): Record<string, { x: number; y: number }>
```

## 9.4 Función pública `applyLayout`

Se debe exportar una función que permita aplicar layout sin volver a parsear el Markdown:

```ts
export function applyLayout(
  nodes: ParsedNode[],
  mode: LayoutMode
): Record<string, { x: number; y: number }> {
  return calculateLayout(nodes, mode)
}
```

## 9.5 Selector interno de layout

```ts
function calculateLayout(
  nodes: ParsedNode[],
  mode: LayoutMode
): Record<string, { x: number; y: number }> {
  switch (mode) {
    case 'horizontal':
      return calculateLayoutHorizontal(nodes)

    case 'vertical':
      return calculateLayoutVertical(nodes)

    case 'radial':
      return calculateLayoutRadial(nodes)

    default:
      return calculateLayoutHorizontal(nodes)
  }
}
```

---

# 10. Conversión desde nodos ReactFlow a `ParsedNode`

Para reaplicar layout sin reparsear Markdown, se necesita reconstruir la estructura jerárquica desde los nodos y edges actuales.

## 10.1 Función propuesta

```ts
function toParsedNodes(
  nodes: Node<MindMapNodeData>[],
  edges: Edge[]
): ParsedNode[] {
  const parentByChild = new Map<string, string>()

  for (const edge of edges) {
    parentByChild.set(edge.target, edge.source)
  }

  return nodes.map((node) => ({
    id: node.id,
    text: node.data.text,
    title: node.data.title,
    level: node.data.level,
    parent: parentByChild.get(node.id) ?? null,
    tags: node.data.tags ?? [],
    developed: node.data.developed ?? '',
  }))
}
```

## 10.2 Reglas

- No debe alterar textos.
- No debe alterar tags.
- No debe alterar edges.
- No debe modificar contenido Markdown.
- Solo debe recalcular `position`.

---

# 11. Estado global del layout

## 11.1 Archivo afectado

```text
src/App.tsx
```

## 11.2 Estado requerido

```ts
const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal')
```

## 11.3 Persistencia inicial

```ts
const getInitialLayoutMode = (): LayoutMode => {
  const saved = localStorage.getItem('mdmap_layout') as LayoutMode | null

  if (saved === 'horizontal' || saved === 'vertical' || saved === 'radial') {
    return saved
  }

  return 'horizontal'
}
```

Uso:

```ts
const [layoutMode, setLayoutMode] = useState<LayoutMode>(getInitialLayoutMode)
```

---

# 12. Acción `handleRelayout`

## 12.1 Descripción

Debe recalcular las posiciones de todos los nodos actuales usando el modo seleccionado.

## 12.2 Firma propuesta

```ts
const handleRelayout = useCallback((mode: LayoutMode) => {
  if (mode === layoutMode) return

  const parsedNodes = toParsedNodes(nodesRef.current, edgesRef.current)
  const positions = applyLayout(parsedNodes, mode)

  setNodes((currentNodes) =>
    currentNodes.map((node) => ({
      ...node,
      position: positions[node.id] ?? node.position,
    }))
  )

  setLayoutMode(mode)
  localStorage.setItem('mdmap_layout', mode)

  markDirty()
  scheduleSave()

  requestFitViewOnce()
}, [
  layoutMode,
  setNodes,
  markDirty,
  scheduleSave,
  requestFitViewOnce,
])
```

## 12.3 Variante para botón “Reorganizar”

Debe existir una acción que reaplique el layout activo aunque el modo no cambie:

```ts
const handleReorganize = useCallback(() => {
  const parsedNodes = toParsedNodes(nodesRef.current, edgesRef.current)
  const positions = applyLayout(parsedNodes, layoutMode)

  setNodes((currentNodes) =>
    currentNodes.map((node) => ({
      ...node,
      position: positions[node.id] ?? node.position,
    }))
  )

  markDirty()
  scheduleSave()
  requestFitViewOnce()
}, [
  layoutMode,
  setNodes,
  markDirty,
  scheduleSave,
  requestFitViewOnce,
])
```

---

# 13. Selector de layout en toolbar

## 13.1 Archivo afectado

```text
src/components/mindmap/Toolbar.tsx
```

## 13.2 Props nuevas

```ts
interface ToolbarProps {
  layoutMode: LayoutMode
  onLayoutChange: (mode: LayoutMode) => void
  onRelayout: () => void
}
```

## 13.3 Interfaz propuesta

Añadir un grupo de tres botones:

```text
[Horizontal] [Vertical] [Radial]
```

Y un botón adicional:

```text
[Reorganizar]
```

## 13.4 Reglas de comportamiento

- El modo activo debe tener estilo destacado.
- Los modos inactivos deben tener estilo secundario o ghost.
- Si el usuario hace clic sobre el modo activo, no debe pasar nada.
- Si el usuario cambia de modo, se recalculan posiciones.
- Si el usuario pulsa “Reorganizar”, se reaplica el layout activo.
- Los botones se deshabilitan si `isEditing === true`.

## 13.5 JSX orientativo

```tsx
<div className="h-6 w-px bg-border mx-1" />

<div className="flex items-center gap-1" title={t('layoutMode')}>
  {(['horizontal', 'vertical', 'radial'] as LayoutMode[]).map((mode) => (
    <Button
      key={mode}
      variant={layoutMode === mode ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onLayoutChange(mode)}
      title={t(`layout_${mode}`)}
      disabled={isEditing}
    >
      <LayoutIcon mode={mode} />
    </Button>
  ))}

  <Button
    variant="ghost"
    size="sm"
    onClick={onRelayout}
    title={t('relayout')}
    disabled={isEditing}
  >
    <RefreshCw className="h-4 w-4" />
  </Button>
</div>
```

---

# 14. Iconos recomendados

Si el proyecto ya usa `lucide-react`, se recomienda:

| Modo | Icono |
|---|---|
| Horizontal | `LayoutList` o `AlignStartVertical` |
| Vertical | `LayoutGrid` o `AlignStartHorizontal` |
| Radial | `Orbit` o `CircleDot` |
| Reorganizar | `RefreshCw` |
| Colapsar | `ChevronRight` |
| Expandir | `ChevronDown` |
| Índice | `ListTree` |
| Filtros | `Filter` |

---

# 15. Traducciones i18n

## 15.1 Archivo afectado

```text
src/lib/i18n.tsx
```

## 15.2 Nuevas claves en español

```ts
layoutMode: 'Modo de disposición',
layout_horizontal: 'Horizontal (derecha)',
layout_vertical: 'Vertical (abajo)',
layout_radial: 'Radial (circular)',
relayout: 'Reorganizar mapa',
collapseBranch: 'Plegar rama',
expandBranch: 'Desplegar rama',
outlinePanel: 'Índice del mapa',
showOutline: 'Mostrar índice',
hideOutline: 'Ocultar índice',
filterByTag: 'Filtrar por etiqueta',
filterByLevel: 'Filtrar por nivel',
clearFilters: 'Limpiar filtros',
centerNode: 'Centrar nodo',
fitView: 'Ver todo',
centerSelection: 'Centrar selección',
```

## 15.3 Nuevas claves en inglés

```ts
layoutMode: 'Layout mode',
layout_horizontal: 'Horizontal (right)',
layout_vertical: 'Vertical (down)',
layout_radial: 'Radial (circular)',
relayout: 'Reorganize map',
collapseBranch: 'Collapse branch',
expandBranch: 'Expand branch',
outlinePanel: 'Map outline',
showOutline: 'Show outline',
hideOutline: 'Hide outline',
filterByTag: 'Filter by tag',
filterByLevel: 'Filter by level',
clearFilters: 'Clear filters',
centerNode: 'Center node',
fitView: 'Fit view',
centerSelection: 'Center selection',
```

---

# 16. Persistencia de preferencias

## 16.1 Preferencias a persistir

Se deben guardar en `localStorage`:

```ts
mdmap_layout
mdmap_outline_visible
mdmap_collapsed_nodes
mdmap_node_width
```

## 16.2 Layout activo

```ts
localStorage.setItem('mdmap_layout', mode)
```

## 16.3 Nodos colapsados

```ts
localStorage.setItem(
  'mdmap_collapsed_nodes',
  JSON.stringify(Array.from(collapsedNodeIds))
)
```

## 16.4 Carga segura

Toda lectura de `localStorage` debe validar el valor antes de usarlo.

---

# 17. Plegado y desplegado de ramas

## 17.1 Objetivo

Permitir que el usuario oculte ramas completas para trabajar con mapas grandes sin ruido visual.

## 17.2 Estado requerido

```ts
const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())
```

## 17.3 Datos del nodo

Extender `MindMapNodeData`:

```ts
interface MindMapNodeData {
  // campos existentes
  hasChildren?: boolean
  isCollapsed?: boolean
  descendantsCount?: number
}
```

## 17.4 Cálculo de descendientes ocultos

Se debe crear una función utilitaria:

```ts
function getHiddenDescendantIds(
  collapsedNodeIds: Set<string>,
  edges: Edge[]
): Set<string> {
  const childrenByParent = new Map<string, string[]>()

  for (const edge of edges) {
    if (!childrenByParent.has(edge.source)) {
      childrenByParent.set(edge.source, [])
    }

    childrenByParent.get(edge.source)!.push(edge.target)
  }

  const hidden = new Set<string>()

  function hideChildren(parentId: string) {
    const children = childrenByParent.get(parentId) || []

    for (const childId of children) {
      hidden.add(childId)
      hideChildren(childId)
    }
  }

  for (const collapsedId of collapsedNodeIds) {
    hideChildren(collapsedId)
  }

  return hidden
}
```

## 17.5 Renderizado

Los nodos descendientes de un nodo colapsado no deben enviarse a ReactFlow o deben marcarse como ocultos.

Preferencia recomendada:

```ts
const visibleNodes = nodes.filter((node) => !hiddenNodeIds.has(node.id))
const visibleEdges = edges.filter(
  (edge) =>
    !hiddenNodeIds.has(edge.source) &&
    !hiddenNodeIds.has(edge.target)
)
```

## 17.6 Botón en el nodo

En `NodeComponent.tsx`, si el nodo tiene hijos, debe aparecer un botón pequeño:

```tsx
<Button
  size="icon"
  variant="ghost"
  className="h-5 w-5"
  onClick={(event) => {
    event.stopPropagation()
    data.onToggleCollapse?.(id)
  }}
  title={data.isCollapsed ? t('expandBranch') : t('collapseBranch')}
>
  {data.isCollapsed ? (
    <ChevronRight className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  )}
</Button>
```

## 17.7 Comportamiento

| Acción | Resultado |
|---|---|
| Plegar nodo | Se ocultan todos sus descendientes |
| Desplegar nodo | Se vuelven a mostrar sus descendientes, salvo ramas internas también colapsadas |
| Cambiar layout | Se recalculan posiciones solo de nodos visibles |
| Reorganizar | Se reorganizan solo nodos visibles |
| Guardar archivo | No modifica el Markdown |
| Recargar app | Se restauran nodos colapsados si siguen existiendo |

## 17.8 Contador de nodos ocultos

Si una rama está colapsada, el nodo padre puede mostrar un pequeño indicador:

```text
+12
```

Ese número representa descendientes ocultos.

---

# 18. Nodos de ancho fijo o controlado

## 18.1 Problema

Actualmente, títulos o textos largos pueden alterar la anchura percibida del nodo y hacer que el layout sea menos predecible.

## 18.2 Archivo afectado

```text
src/components/mindmap/NodeComponent.tsx
```

## 18.3 Reglas visuales

- Ancho normal del nodo: `240px`.
- Ancho máximo del contenido textual: `210px`.
- El texto debe hacer wrap.
- No se debe expandir el nodo indefinidamente.
- El contenido desarrollado puede tener mayor altura, pero no mayor anchura.

## 18.4 Estilo recomendado

```tsx
<div
  className="..."
  style={{
    width: 240,
    maxWidth: 240,
  }}
>
  <div className="text-left break-words whitespace-pre-line font-semibold max-w-[210px]">
    {title}
  </div>
</div>
```

## 18.5 Opcional avanzado

Permitir una preferencia futura:

```ts
type NodeWidthMode = 'compact' | 'normal' | 'wide'
```

Con valores:

```ts
compact: 200
normal: 240
wide: 320
```

En esta versión se implementará solo `normal`.

---

# 19. Gestión de `fitView`

## 19.1 Problema actual

El uso permanente de `fitView` puede empeorar la experiencia en mapas grandes porque fuerza a ReactFlow a mostrar todo el mapa, alejando demasiado la vista.

## 19.2 Nuevo comportamiento

`fitView` no debe ejecutarse permanentemente en cada render.

Debe ejecutarse solo en estos casos:

1. Primera carga de archivo.
2. Cambio de layout.
3. Acción manual “Ver todo”.
4. Acción manual “Reorganizar mapa”.
5. Tras abrir un mapa nuevo.

No debe ejecutarse automáticamente:

- Al editar texto.
- Al seleccionar nodo.
- Al arrastrar nodo.
- Al añadir un nodo, salvo que sea una preferencia explícita.
- Al plegar/desplegar, salvo que el usuario pulse “Ver todo”.

## 19.3 API propuesta

```ts
function requestFitViewOnce() {
  setTimeout(() => {
    reactFlowInstance.fitView({
      padding: 0.2,
      duration: 300,
    })
  }, 50)
}
```

## 19.4 Botones nuevos

Añadir en toolbar:

```text
[Ver todo]
[Centrar selección]
```

## 19.5 Criterio especial

Si el mapa tiene más de 80 nodos, `fitView` debe usar un zoom mínimo legible o evitar reducir demasiado.

Ejemplo:

```ts
fitView({
  padding: 0.2,
  minZoom: 0.35,
})
```

Si la versión de ReactFlow no soporta `minZoom` en `fitView`, se deberá ajustar posteriormente con `setViewport`.

---

# 20. Panel lateral tipo índice

## 20.1 Objetivo

Añadir una navegación jerárquica complementaria al mapa visual.

## 20.2 Componente nuevo

```text
src/components/mindmap/OutlinePanel.tsx
```

## 20.3 Funcionalidad

El panel debe mostrar la estructura del mapa como árbol textual:

```text
▾ Proyecto
  ▾ Fase 1
    - Tarea A
    - Tarea B
  ▸ Fase 2
```

## 20.4 Comportamiento

- Click en un elemento: selecciona y centra el nodo en el mapa.
- Doble click: entra en edición del nodo, si aplica.
- Botón de plegar/desplegar: reutiliza el mismo estado `collapsedNodeIds`.
- Debe indicar visualmente el nodo seleccionado.
- Debe permitir búsqueda rápida dentro del índice.
- Debe poder ocultarse o mostrarse desde toolbar.

## 20.5 Props propuestas

```ts
interface OutlinePanelProps {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]
  selectedNodeId?: string | null
  collapsedNodeIds: Set<string>
  onToggleCollapse: (nodeId: string) => void
  onSelectNode: (nodeId: string) => void
  onCenterNode: (nodeId: string) => void
}
```

## 20.6 Layout visual

- Anchura sugerida: `280px`.
- Posición: lateral izquierdo.
- Debe ser redimensionable en una versión futura.
- En móvil/tablet puede mostrarse como panel flotante.

---

# 21. Filtros y búsqueda avanzada

## 21.1 Objetivo

Reducir ruido visual en mapas grandes.

## 21.2 Filtros mínimos

Se implementarán:

1. Filtro por texto.
2. Filtro por tag.
3. Filtro por nivel.

## 21.3 Comportamiento recomendado

Cuando hay un filtro activo:

- Los nodos coincidentes se muestran normales.
- Los nodos no coincidentes se atenúan.
- Opcionalmente, se deben mantener visibles los ancestros de nodos coincidentes.
- Debe existir una acción “Limpiar filtros”.

## 21.4 Estado propuesto

```ts
interface MapFilters {
  searchText: string
  tags: string[]
  levels: number[]
}
```

## 21.5 Función auxiliar

```ts
function getFilteredNodeIds(
  nodes: Node<MindMapNodeData>[],
  filters: MapFilters
): Set<string> {
  return new Set(
    nodes
      .filter((node) => {
        const matchesText =
          !filters.searchText ||
          node.data.text.toLowerCase().includes(filters.searchText.toLowerCase())

        const matchesTags =
          filters.tags.length === 0 ||
          filters.tags.some((tag) => node.data.tags?.includes(tag))

        const matchesLevel =
          filters.levels.length === 0 ||
          filters.levels.includes(node.data.level)

        return matchesText && matchesTags && matchesLevel
      })
      .map((node) => node.id)
  )
}
```

---

# 22. Creación de nuevos nodos

## 22.1 Problema

Las funciones actuales de añadir hijo o hermano colocan nodos con cálculos locales simples. En mapas grandes esto puede provocar solapes o posiciones poco útiles.

## 22.2 Nuevo comportamiento

La creación de nodos debe adaptarse al layout activo.

## 22.3 En modo horizontal

Al añadir hijo:

```ts
newPosition = {
  x: parent.position.x + levelGap,
  y: parent.position.y + nextAvailableOffsetY,
}
```

Al añadir hermano:

```ts
newPosition = {
  x: current.position.x,
  y: current.position.y + rowGap,
}
```

## 22.4 En modo vertical

Al añadir hijo:

```ts
newPosition = {
  x: parent.position.x + nextAvailableOffsetX,
  y: parent.position.y + verticalGap,
}
```

## 22.5 En modo radial

Al añadir un nodo en modo radial, se recomienda:

- Colocarlo cerca del padre.
- No recalcular automáticamente todo el layout.
- Mostrar o permitir botón “Reorganizar” para recolocar correctamente.

## 22.6 Regla general

Después de añadir nodos, no se debe ejecutar layout global automáticamente, salvo si el usuario pulsa “Reorganizar”.

---

# 23. Edges y conexiones visuales

## 23.1 Objetivo

Mejorar legibilidad de conexiones según layout activo.

## 23.2 Reglas

| Layout | Tipo de conexión recomendado |
|---|---|
| Horizontal | `smoothstep` o `bezier` |
| Vertical | `smoothstep` |
| Radial | `bezier` |

## 23.3 Handles

Si se usan handles explícitos:

- En layout horizontal: source derecha, target izquierda.
- En layout vertical: source abajo, target arriba.
- En layout radial: automático o centrado.

## 23.4 Implementación opcional

Añadir en `MindMapNodeData`:

```ts
layoutMode?: LayoutMode
```

Para que el nodo pueda renderizar handles según el layout activo.

---

# 24. Comportamiento al abrir archivos

## 24.1 Archivo nuevo

Al abrir un archivo Markdown:

- Se parsea el Markdown.
- Se aplica el layout activo guardado.
- Si no hay layout guardado, se usa `horizontal`.
- Se ejecuta `fitView` una sola vez.

## 24.2 Archivo existente

Si en el futuro se guardan posiciones, se podría preguntar si conservarlas o recalcularlas. En esta versión, al abrir archivo `.md`, se recalcula layout desde el Markdown.

---

# 25. Comportamiento al cambiar de layout

| Situación | Comportamiento |
|---|---|
| Usuario selecciona otro layout | Se recalculan posiciones inmediatamente |
| Usuario selecciona el layout actual | No ocurre nada |
| Usuario pulsa “Reorganizar” | Se reaplica el layout activo |
| Hay nodos colapsados | Se reorganizan solo los visibles |
| Hay filtros activos | Se mantienen los filtros |
| Hay nodo seleccionado | Se conserva la selección si el nodo sigue visible |
| Hay nodo en edición | Botones de layout deshabilitados |
| Se cambia layout | Se ejecuta `fitView` una sola vez |
| Se cambia layout | Se guarda preferencia en `localStorage` |

---

# 26. Arquitectura propuesta

## 26.1 Nuevos/actualizados archivos

```text
src/lib/types.ts
src/lib/parser/mdToNodes.ts
src/lib/layout/applyLayout.ts
src/lib/layout/layoutHorizontal.ts
src/lib/layout/layoutVertical.ts
src/lib/layout/layoutRadial.ts
src/lib/layout/layoutUtils.ts
src/components/mindmap/Toolbar.tsx
src/components/mindmap/NodeComponent.tsx
src/components/mindmap/MindMapCanvas.tsx
src/components/mindmap/OutlinePanel.tsx
src/components/mindmap/MapFilters.tsx
src/lib/i18n.tsx
src/App.tsx
```

## 26.2 Recomendación

Aunque puede implementarse dentro de `mdToNodes.ts`, se recomienda mover la lógica de layout a una carpeta específica:

```text
src/lib/layout/
```

Esto mejora mantenimiento y testabilidad.

---

# 27. Utilidades de layout

## 27.1 `buildChildrenMap`

```ts
export const ROOT_KEY = '__roots__'

export function buildChildrenMap(nodes: ParsedNode[]) {
  const childrenOf = new Map<string, ParsedNode[]>()

  for (const node of nodes) {
    const key = node.parent ?? ROOT_KEY

    if (!childrenOf.has(key)) {
      childrenOf.set(key, [])
    }

    childrenOf.get(key)!.push(node)
  }

  return childrenOf
}
```

## 27.2 `getNodeDepth`

```ts
export function getNodeDepth(
  nodeId: string,
  parentByChild: Map<string, string>
): number {
  let depth = 0
  let current = parentByChild.get(nodeId)

  while (current) {
    depth++
    current = parentByChild.get(current)
  }

  return depth
}
```

---

# 28. Testing recomendado

## 28.1 Tests unitarios

Crear tests para:

```text
calculateLayoutHorizontal
calculateLayoutVertical
calculateLayoutRadial
getHiddenDescendantIds
toParsedNodes
getFilteredNodeIds
```

## 28.2 Casos de prueba

### Caso 1 — Mapa pequeño

```md
# Proyecto
## Fase 1
## Fase 2
```

Resultado esperado:

- Layout horizontal legible.
- Fase 1 y Fase 2 debajo de Proyecto.
- No hay solapes.

### Caso 2 — Muchos hijos directos

```md
# Proyecto
## Item 1
## Item 2
## Item 3
...
## Item 30
```

Resultado esperado:

- En horizontal, el mapa crece principalmente en vertical.
- No se aleja excesivamente.
- Todos los nodos son legibles con zoom razonable.

### Caso 3 — Árbol profundo

```md
# A
## B
### C
#### D
##### E
```

Resultado esperado:

- En horizontal, los nodos crecen hacia la derecha.
- No hay solapes.
- Las conexiones son claras.

### Caso 4 — Plegado

```md
# A
## B
### C
### D
## E
```

Acción:

- Plegar B.

Resultado esperado:

- C y D desaparecen.
- B muestra indicador de rama plegada.
- E sigue visible.

### Caso 5 — Cambio de layout

Acción:

- Cambiar de horizontal a radial.

Resultado esperado:

- Se recalculan posiciones.
- No se modifican textos ni tags.
- Se ejecuta `fitView` una sola vez.

---

# 29. Criterios de aceptación

## 29.1 Layouts

- [ ] Al cargar la app por primera vez, el layout por defecto es `horizontal`.
- [ ] El modo horizontal coloca la raíz a la izquierda y los hijos hacia la derecha.
- [ ] El modo horizontal crece principalmente en vertical.
- [ ] El modo vertical mantiene la raíz arriba y los hijos hacia abajo.
- [ ] El modo vertical es más compacto que el actual.
- [ ] El modo radial coloca la raíz en el centro.
- [ ] El modo radial distribuye hijos en radios concéntricos.
- [ ] Los tres modos funcionan con múltiples raíces.
- [ ] El layout activo persiste al recargar la aplicación.

## 29.2 Toolbar

- [ ] La toolbar muestra tres botones de layout.
- [ ] La toolbar muestra un botón “Reorganizar”.
- [ ] El botón del layout activo tiene estilo destacado.
- [ ] Los botones muestran tooltip en español e inglés.
- [ ] Los botones se deshabilitan durante edición de nodo.

## 29.3 Plegado

- [ ] Los nodos con hijos muestran botón de plegado.
- [ ] Al plegar un nodo se ocultan todos sus descendientes.
- [ ] Al desplegar un nodo se recuperan los descendientes visibles.
- [ ] El estado de plegado persiste entre sesiones.
- [ ] El Markdown no se modifica al plegar o desplegar.

## 29.4 Visual

- [ ] Los nodos tienen ancho fijo o máximo.
- [ ] Los textos largos hacen wrap.
- [ ] Los nodos no crecen indefinidamente en horizontal.
- [ ] Las conexiones son legibles según el layout activo.
- [ ] No hay solapes importantes en mapas de hasta 30 nodos.

## 29.5 Navegación

- [ ] Existe panel lateral tipo índice.
- [ ] El panel muestra jerarquía del mapa.
- [ ] Click en un elemento centra el nodo correspondiente.
- [ ] El panel puede ocultarse y mostrarse.
- [ ] El panel respeta el estado de ramas plegadas.

## 29.6 Filtros

- [ ] Se puede filtrar por texto.
- [ ] Se puede filtrar por tag.
- [ ] Se puede filtrar por nivel.
- [ ] Se pueden limpiar todos los filtros.
- [ ] Los nodos filtrados se resaltan o los no coincidentes se atenúan.

## 29.7 `fitView`

- [ ] `fitView` no se ejecuta permanentemente.
- [ ] `fitView` se ejecuta al abrir archivo.
- [ ] `fitView` se ejecuta al cambiar layout.
- [ ] Existe botón manual “Ver todo”.
- [ ] Existe acción “Centrar selección”.
- [ ] En mapas grandes no se fuerza un zoom ilegible.

---

# 30. Orden de implementación recomendado

## Fase 1 — Layouts base

1. Crear tipo `LayoutMode`.
2. Refactorizar `calculateLayout`.
3. Implementar `calculateLayoutHorizontal`.
4. Adaptar el layout vertical actual.
5. Implementar `calculateLayoutRadial`.
6. Añadir `applyLayout`.
7. Validar mapas pequeños y medianos.

## Fase 2 — UI de layout

1. Añadir estado `layoutMode` en `App.tsx`.
2. Añadir selector en `Toolbar.tsx`.
3. Añadir botón “Reorganizar”.
4. Añadir traducciones.
5. Persistir layout en `localStorage`.

## Fase 3 — Control visual

1. Fijar ancho de nodos.
2. Ajustar wrapping de textos.
3. Ajustar edges según layout.
4. Revisar handles si existen.

## Fase 4 — Plegado de ramas

1. Añadir estado `collapsedNodeIds`.
2. Calcular descendientes ocultos.
3. Añadir botón en nodos con hijos.
4. Filtrar nodos y edges visibles.
5. Persistir estado de plegado.

## Fase 5 — Navegación y filtros

1. Crear `OutlinePanel`.
2. Añadir selección y centrado desde índice.
3. Añadir filtros por texto, tags y nivel.
4. Añadir acción “Limpiar filtros”.
5. Probar comportamiento con mapas grandes.

## Fase 6 — Ajuste de `fitView`

1. Eliminar `fitView` permanente.
2. Ejecutar `fitView` solo en eventos controlados.
3. Añadir botón “Ver todo”.
4. Añadir botón “Centrar selección”.
5. Validar mapas grandes.

---

# 31. Priorización si se quiere implementar por mínimos

Si se necesita una primera versión rápida, implementar en este orden:

1. Layout horizontal por defecto.
2. Nodos de ancho fijo.
3. Selector de layout.
4. Botón “Reorganizar”.
5. Eliminar `fitView` automático permanente.
6. Plegado/desplegado de ramas.
7. Panel índice.
8. Filtros por tags/niveles.

El mínimo realmente útil sería:

```text
Layout horizontal + ancho fijo de nodos + plegado de ramas + botón Reorganizar
```

Con esas cuatro mejoras la aplicación ya sería mucho más usable en mapas grandes.

---

# 32. Riesgos y mitigaciones

## Riesgo 1 — Solapes en radial

**Mitigación:** documentar que radial es visual, no recomendado para mapas muy grandes. Sugerir horizontal si hay muchos nodos.

## Riesgo 2 — Pérdida de posiciones manuales

**Mitigación:** solo recalcular posiciones cuando el usuario cambie layout o pulse “Reorganizar”.

## Riesgo 3 — Estado colapsado obsoleto

Puede ocurrir si se borra un nodo cuyo ID estaba guardado en `localStorage`.

**Mitigación:** al cargar, filtrar `collapsedNodeIds` para conservar solo IDs existentes.

## Riesgo 4 — `fitView` demasiado alejado

**Mitigación:** usarlo solo en acciones explícitas y evitar zoom inferior a un umbral legible.

## Riesgo 5 — Aumento de complejidad en `App.tsx`

**Mitigación:** extraer lógica a hooks:

```text
useLayoutMode
useCollapsedNodes
useMapFilters
useOutlineNavigation
```

---

# 33. Hooks recomendados

## 33.1 `useLayoutMode`

Responsable de:

- Estado del layout activo.
- Persistencia.
- Cambio de layout.
- Reorganización.

## 33.2 `useCollapsedNodes`

Responsable de:

- Estado de ramas colapsadas.
- Persistencia.
- Cálculo de nodos ocultos.

## 33.3 `useMapFilters`

Responsable de:

- Texto de búsqueda.
- Tags activos.
- Niveles activos.
- Limpieza de filtros.

## 33.4 `useOutlineNavigation`

Responsable de:

- Selección desde índice.
- Centrado de nodo.
- Sincronización con nodo seleccionado.

---

# 34. Decisión técnica recomendada

La implementación debe evitar librerías externas de layout en esta fase.

Motivos:

- El árbol Markdown ya tiene una jerarquía clara.
- Los tres layouts requeridos son relativamente simples.
- Se mantiene menor peso de bundle.
- Se controla mejor el resultado visual.
- Se reduce dependencia técnica.

En una versión futura se podría valorar ELK o Dagre si aparecen necesidades más complejas, como auto-layout con restricciones, evitación avanzada de solapes o grafos no jerárquicos.

---

# 35. Resultado esperado

Después de implementar esta especificación, MDMap deberá permitir trabajar cómodamente con mapas grandes.

El comportamiento esperado será:

- Al abrir un Markdown grande, el mapa se verá en horizontal, con la raíz a la izquierda.
- Los nodos no crecerán indefinidamente en anchura.
- El usuario podrá plegar ramas irrelevantes.
- El usuario podrá reorganizar el mapa cuando lo necesite.
- El usuario podrá cambiar entre horizontal, vertical y radial.
- El usuario podrá navegar por el índice lateral.
- El usuario podrá filtrar por tags, texto o nivel.
- El mapa no se alejará automáticamente hasta volverse ilegible.
- La experiencia será más parecida a una herramienta real de mapas mentales grandes.

---

# 36. Resumen ejecutivo

La mejora principal consiste en cambiar el enfoque de visualización: el mapa no debe intentar mostrar siempre todo al mismo tiempo, sino permitir explorar, plegar, reorganizar y navegar.

La prioridad debe ser el layout horizontal compacto, porque resuelve directamente el problema de mapas excesivamente anchos. Después deben implementarse el plegado de ramas y el control del zoom, ya que son las funcionalidades que más impacto tendrán en la usabilidad real.

La especificación queda preparada para implementación incremental, sin romper el modelo actual basado en Markdown ni introducir dependencias externas innecesarias.

---

# 37. Ampliación: semántica real del campo `developed`

## 37.1 Decisión funcional

El campo `developed` no debe interpretarse simplemente como “rama expandida”. Su significado funcional será:

```ts
developed: boolean
```

- `developed === true`: rama trabajada, desarrollada o completada.
- `developed === false`: rama pendiente, no trabajada o no completada.
- `developed === undefined`: se interpreta como `false` salvo que el parser actual ya lo inicialice de otro modo.

Por tanto, `developed` representa el **estado de avance de la rama**, no únicamente su visibilidad.

## 37.2 Relación entre `developed` y visibilidad

Una rama marcada como `developed` podrá ocultarse visualmente para reducir ruido en mapas grandes, pero el usuario siempre deberá tener control explícito para volver a mostrarla.

Regla principal:

```text
Las ramas developed pueden ocultarse mediante un filtro o modo de visualización, pero nunca deben desaparecer sin que exista un botón visible para recuperarlas.
```

## 37.3 Estados separados

Se deben separar dos conceptos:

```ts
interface MindMapNodeData {
  developed?: boolean
  isCollapsed?: boolean
  hasChildren?: boolean
  descendantsCount?: number
}
```

- `developed`: indica si una rama está trabajada/completada.
- `isCollapsed`: indica si una rama está plegada visualmente.
- `hasChildren`: indica si el nodo tiene hijos.
- `descendantsCount`: número de descendientes, útil para mostrar contadores.

Esto evita mezclar estado funcional con estado visual.

## 37.4 Comportamiento esperado

| Situación | Resultado |
|---|---|
| Nodo marcado como `developed` | Se muestra visualmente como rama completada |
| Activar “Ocultar desarrolladas” | Se ocultan ramas marcadas como `developed` |
| Desactivar “Ocultar desarrolladas” | Se vuelven a mostrar |
| Nodo desarrollado con hijos | Puede plegarse/desplegarse igual que cualquier otro nodo |
| Nodo no desarrollado | No se oculta por el filtro de desarrolladas |
| Guardar Markdown | Se conserva el estado `developed` según el mecanismo actual del modelo |
| Cambiar layout | No cambia el estado `developed` |

## 37.5 UI requerida

Añadir en la toolbar o panel de filtros:

```text
[Mostrar ramas desarrolladas]
[Ocultar ramas desarrolladas]
```

También puede implementarse como toggle:

```text
☑ Mostrar ramas desarrolladas
```

Recomendación:

- Por defecto: mostrar todas las ramas.
- Si el usuario activa “Ocultar desarrolladas”, se ocultan los descendientes o ramas completas marcadas como `developed`.
- Debe quedar visible algún indicador de que hay ramas ocultas.

## 37.6 Indicador visual

Los nodos desarrollados deben tener una marca visual clara:

```text
✓
```

o una etiqueta:

```text
Completada
```

Ejemplo de dato:

```ts
data.developed === true
```

Comportamiento visual recomendado:

- Badge pequeño en el nodo.
- Estilo más tenue o borde diferenciado.
- Tooltip: “Rama desarrollada/completada”.

## 37.7 Botón para recuperar ramas ocultas

Cuando existan ramas desarrolladas ocultas, debe mostrarse un control persistente:

```text
Mostrar ramas desarrolladas ocultas
```

Criterio de aceptación:

- [ ] El usuario nunca queda en una vista en la que no sepa que hay ramas ocultas.
- [ ] El usuario puede restaurar todas las ramas ocultas con un clic.
- [ ] Ocultar desarrolladas no modifica el Markdown.
- [ ] Mostrar desarrolladas no modifica el Markdown.
- [ ] El estado `developed` sigue representando avance/completado, no layout.

---

# 38. Colapso y expansión de ramas

## 38.1 Objetivo

Permitir plegar ramas para trabajar cómodamente con mapas grandes.

A diferencia de `developed`, el colapso es un estado puramente visual.

## 38.2 Estado visual

```ts
const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())
```

O, preferiblemente, dentro de `useMindMapStore`:

```ts
collapsedNodeIds: string[]
```

## 38.3 Comportamiento

| Acción | Resultado |
|---|---|
| Plegar nodo | Oculta todos sus descendientes |
| Desplegar nodo | Vuelve a mostrar sus descendientes |
| Plegar nodo desarrollado | Se comporta igual que cualquier otro nodo |
| Ocultar desarrolladas | Oculta ramas `developed`, independientemente del colapso manual |
| Mostrar desarrolladas | Restaura ramas ocultas por filtro, respetando colapsos manuales |
| Reorganizar | Recalcula layout sobre los nodos visibles |
| Ver todo | Centra los nodos visibles |
| Expandir todo | Vacía `collapsedNodeIds` |
| Colapsar todo | Colapsa todos los nodos con hijos excepto raíces |

## 38.4 Interacciones de usuario

| Interacción | Acción |
|---|---|
| Click normal en nodo | Seleccionar nodo |
| Doble click en nodo | Editar nodo |
| Click en chevron | Plegar/desplegar |
| Alt + click en nodo | Plegar/desplegar, opcional |
| Toolbar: Expandir todo | Muestra ramas colapsadas manualmente |
| Toolbar: Mostrar desarrolladas | Muestra ramas ocultas por filtro developed |

## 38.5 Reglas de selección

- Si se colapsa una rama que contiene el nodo seleccionado, la selección pasa al nodo padre colapsado.
- Si se ocultan ramas desarrolladas y el nodo seleccionado queda oculto, la selección pasa al ancestro visible más cercano.
- Si no hay ancestro visible, se limpia la selección.

## 38.6 Persistencia

El colapso manual se guarda en `localStorage`.

```ts
localStorage.setItem(
  'mdmap_collapsed_nodes',
  JSON.stringify(Array.from(collapsedNodeIds))
)
```

La visibilidad de ramas desarrolladas también se guarda como preferencia:

```ts
localStorage.setItem('mdmap_show_developed_branches', JSON.stringify(showDevelopedBranches))
```

---

# 39. Refactor obligatorio de estado y hooks

## 39.1 Problema

`App.tsx` concentra demasiada lógica: nodos, edges, layout, edición, guardado, operaciones, búsqueda y sincronización.

Además, `useMindMapStore` existe pero está prácticamente vacío, por lo que no aporta valor real.

## 39.2 Decisión técnica

`App.tsx` debe dejar de ser el contenedor principal de lógica de negocio.

Debe actuar como componente de composición:

```tsx
function App() {
  const layout = useLayoutMode()
  const nodeOperations = useNodeOperations()
  const clipboard = useClipboard()
  const history = useUndoRedo()
  const exportMap = useMapExport()
  const filters = useMapFilters()

  return (
    // composición de componentes
  )
}
```

## 39.3 Hooks obligatorios

Se deberán crear o completar los siguientes hooks:

```text
useLayoutMode
useNodeOperations
useCollapsedNodes
useClipboard
useUndoRedo
useMapExport
useMarkdownSync
useMapFilters
useOutlineNavigation
```

## 39.4 Responsabilidades

### `useLayoutMode`

Responsable de:

- Estado del layout activo.
- Cambio de layout.
- Reorganización.
- Persistencia de layout.
- Aplicación de layout sobre nodos visibles.

### `useNodeOperations`

Responsable de:

- Añadir hijo.
- Añadir hermano.
- Borrar nodo.
- Editar nodo.
- Duplicar nodo.
- Cambiar tags.
- Marcar o desmarcar `developed`.
- Mover nodo.
- Actualizar posición manual.

### `useCollapsedNodes`

Responsable de:

- Plegar/desplegar nodos.
- Expandir todo.
- Colapsar todo.
- Calcular nodos ocultos por colapso.
- Persistir `collapsedNodeIds`.

### `useClipboard`

Responsable de:

- Copiar nodo.
- Cortar nodo.
- Pegar nodo.
- Duplicar selección.
- Mantener relaciones internas al copiar subárboles.

### `useUndoRedo`

Responsable de:

- Guardar snapshots.
- Deshacer.
- Rehacer.
- Limitar historial.
- Registrar motivo del cambio.

### `useMapExport`

Responsable de:

- Exportar PNG.
- Exportar SVG en fase posterior.
- Exportar vista actual.
- Exportar mapa completo.
- Restaurar viewport tras exportar.

### `useMarkdownSync`

Responsable de:

- Convertir Markdown a nodos.
- Convertir nodos a Markdown.
- Determinar qué cambios modifican Markdown.
- Programar guardado.
- Marcar estado dirty.

### `useMapFilters`

Responsable de:

- Filtro por texto.
- Filtro por tag.
- Filtro por nivel.
- Filtro de ramas developed.
- Limpieza de filtros.

### `useOutlineNavigation`

Responsable de:

- Panel índice.
- Selección desde árbol.
- Centrado de nodo.
- Sincronización de colapso con canvas.

---

# 40. Store real `useMindMapStore`

## 40.1 Objetivo

El store debe dejar de ser un stub y convertirse en el centro de estado de la aplicación.

## 40.2 Estado recomendado

```ts
interface MindMapState {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]

  selectedNodeId: string | null

  layoutMode: LayoutMode
  collapsedNodeIds: string[]

  filters: MapFilters
  showDevelopedBranches: boolean

  currentMarkdown: string
  isDirty: boolean

  manualPositions: Record<string, { x: number; y: number }>

  history: HistorySnapshot[]
  future: HistorySnapshot[]

  outlineVisible: boolean
}
```

## 40.3 Acciones recomendadas

```ts
interface MindMapActions {
  setNodes(nodes: Node<MindMapNodeData>[]): void
  setEdges(edges: Edge[]): void

  selectNode(nodeId: string | null): void

  updateNode(nodeId: string, patch: Partial<MindMapNodeData>): void
  addNode(node: Node<MindMapNodeData>, parentId?: string): void
  deleteNode(nodeId: string): void
  moveNode(nodeId: string, position: { x: number; y: number }): void

  setLayoutMode(mode: LayoutMode): void
  applyCurrentLayout(): void

  toggleCollapse(nodeId: string): void
  expandAll(): void
  collapseAll(): void

  setShowDevelopedBranches(value: boolean): void
  toggleDeveloped(nodeId: string): void

  setFilters(filters: MapFilters): void
  clearFilters(): void

  pushHistory(reason: HistoryReason): void
  undo(): void
  redo(): void

  setMarkdown(markdown: string): void
  markDirty(): void
  markClean(): void
}
```

## 40.4 Regla

Toda operación estructural debe pasar por el store o por hooks que actualicen el store.

---

# 41. Exportación como imagen

## 41.1 Objetivo

Permitir compartir el mapa visual sin necesidad de abrir la app.

## 41.2 Formatos

Primera fase:

```text
PNG
```

Segunda fase:

```text
SVG
```

## 41.3 Opciones mínimas

```text
Exportar vista actual
Exportar mapa completo
Exportar selección
Fondo blanco
Fondo transparente
```

## 41.4 Implementación PNG

Se recomienda usar una librería como `html-to-image`.

Flujo:

1. Guardar viewport actual.
2. Si el usuario elige “mapa completo”, aplicar temporalmente un viewport que incluya los nodos visibles.
3. Capturar el contenedor de ReactFlow.
4. Descargar el PNG.
5. Restaurar viewport previo.

## 41.5 Reglas

- La exportación no debe alterar el estado final del canvas.
- No debe modificar Markdown.
- No debe modificar nodos.
- Debe excluir controles de UI si se exporta solo el mapa.
- Debe respetar visibilidad actual: ramas colapsadas y filtro de developed.

## 41.6 Criterios de aceptación

- [ ] Se puede exportar como PNG.
- [ ] El PNG incluye nodos y conexiones.
- [ ] Se puede exportar vista actual.
- [ ] Se puede exportar mapa completo.
- [ ] La exportación respeta ramas colapsadas.
- [ ] La exportación respeta ocultación de ramas developed.
- [ ] El viewport final del usuario queda igual que antes de exportar.
- [ ] SVG queda documentado como fase posterior.

---

# 42. Historial de deshacer y rehacer

## 42.1 Objetivo

Evitar pérdida irreversible de trabajo.

## 42.2 Atajos

```text
Ctrl+Z / Cmd+Z: deshacer
Ctrl+Y / Cmd+Y: rehacer
Ctrl+Shift+Z / Cmd+Shift+Z: rehacer
```

## 42.3 Modelo

```ts
type HistoryReason =
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

interface HistorySnapshot {
  nodes: Node<MindMapNodeData>[]
  edges: Edge[]
  markdown: string
  layoutMode: LayoutMode
  collapsedNodeIds: string[]
  showDevelopedBranches: boolean
  manualPositions: Record<string, { x: number; y: number }>
  timestamp: number
  reason: HistoryReason
}
```

## 42.4 Límite

```ts
const MAX_HISTORY = 100
```

## 42.5 Acciones que entran en historial

- Crear nodo.
- Borrar nodo.
- Editar texto.
- Mover nodo.
- Cambiar layout.
- Reorganizar.
- Plegar/desplegar rama.
- Marcar/desmarcar `developed`.
- Mostrar/ocultar desarrolladas.
- Pegar nodos.
- Cambiar jerarquía si se implementa.

## 42.6 Acciones que no entran en historial

- Zoom.
- Pan.
- Selección.
- Abrir/cerrar panel índice.
- Cambiar foco de búsqueda.
- Hover.
- Mostrar tooltip.

## 42.7 Criterios de aceptación

- [ ] Ctrl+Z revierte la última operación.
- [ ] Ctrl+Y rehace la última operación deshecha.
- [ ] Borrar un nodo puede deshacerse.
- [ ] Editar texto puede deshacerse.
- [ ] Mover un nodo puede deshacerse.
- [ ] Marcar developed puede deshacerse.
- [ ] Ocultar/mostrar ramas developed puede deshacerse.
- [ ] El historial se limpia al abrir un archivo nuevo.
- [ ] El historial no crece indefinidamente.

---

# 43. Movimiento manual de nodos y persistencia en `localStorage`

## 43.1 Decisión

De momento, las posiciones manuales se guardarán en `localStorage`.

No se guardarán en el Markdown.

No se implementará la opción de reordenar Markdown automáticamente al arrastrar nodos.

## 43.2 Regla principal

```text
Mover un nodo actualiza únicamente su posición visual.
No modifica la jerarquía Markdown.
No modifica el orden Markdown.
No modifica el contenido Markdown.
```

## 43.3 Estado requerido

```ts
manualPositions: Record<string, { x: number; y: number }>
```

## 43.4 Persistencia

```ts
localStorage.setItem(
  `mdmap_manual_positions_${fileId}`,
  JSON.stringify(manualPositions)
)
```

## 43.5 Carga

Al abrir un archivo:

1. Se parsea Markdown.
2. Se aplica el layout activo.
3. Se cargan posiciones manuales desde `localStorage`.
4. Las posiciones manuales sobrescriben las posiciones calculadas para los nodos existentes.
5. Se descartan posiciones de nodos que ya no existen.

## 43.6 Drag and drop

En `onNodeDragStop`:

```ts
function handleNodeDragStop(
  nodeId: string,
  position: { x: number; y: number }
) {
  updateManualPosition(nodeId, position)
  updateNodePosition(nodeId, position)
  pushHistory('move-node')
}
```

## 43.7 Reorganizar

El botón “Reorganizar” reaplica el layout activo.

Decisión recomendada:

```text
Reorganizar ignora temporalmente las posiciones manuales y pregunta si se desean sustituir.
```

Si no se quiere añadir modal en primera fase:

```text
Reorganizar sobrescribe posiciones manuales de los nodos visibles.
```

Debe quedar documentado en tooltip:

```text
Reorganiza el mapa y sustituye las posiciones manuales visibles.
```

## 43.8 Criterios de aceptación

- [ ] El usuario puede arrastrar nodos.
- [ ] La posición queda guardada en `localStorage`.
- [ ] Al recargar, los nodos recuperan su posición manual.
- [ ] Mover nodos no cambia el Markdown.
- [ ] Reorganizar aplica el layout activo.
- [ ] Reorganizar tiene comportamiento claro sobre posiciones manuales.
- [ ] Las posiciones obsoletas se descartan al abrir un archivo.

---

# 44. Sincronización Markdown - Canvas

## 44.1 Fuentes de verdad

```text
Markdown: fuente de verdad para contenido y jerarquía.
ReactFlow/store: fuente de verdad para posición visual, selección, zoom, filtros y estado temporal.
localStorage: fuente de persistencia para preferencias visuales y posiciones manuales.
```

## 44.2 Cambios que modifican Markdown

- Crear nodo.
- Borrar nodo.
- Editar texto.
- Cambiar tags embebidos en el texto.
- Cambiar jerarquía mediante acción explícita.
- Reordenar estructura mediante acción explícita futura.

## 44.3 Cambios que no modifican Markdown

- Zoom.
- Pan.
- Selección.
- Filtros.
- Colapso visual.
- Mostrar/ocultar ramas desarrolladas.
- Mover nodos manualmente.
- Cambiar layout.
- Abrir/cerrar panel índice.
- Exportar imagen.

## 44.4 Regla sobre opción C

No se implementa la sincronización automática de arrastrar nodo hacia Markdown.

La opción C queda descartada en esta fase.

```text
Arrastrar nodos no reordena Markdown.
```

Si en el futuro se quiere modificar Markdown por drag and drop, deberá hacerse con una acción explícita de “cambiar jerarquía” y no con el simple movimiento visual.

---

# 45. Robustez del parser Markdown

## 45.1 Objetivo

Permitir abrir archivos procedentes de Obsidian, editores Markdown comunes y documentos escritos manualmente sin errores de estructura inesperados.

## 45.2 Casos soportados

El parser debe soportar:

- Headings `#`, `##`, `###`, etc.
- Listas con `-`.
- Listas con `*`.
- Listas con `+`.
- Listas numeradas `1.`, `2.`, `3.`.
- Indentación con espacios.
- Indentación con tabs.
- Líneas vacías entre nodos.
- Múltiples raíces.
- Documento sin heading inicial.
- Tags tipo `#tag`.
- Links Markdown `[texto](url)`.
- Wiki links de Obsidian `[[Página]]`.
- Frontmatter YAML al inicio del archivo.
- Bloques de código cercados con triple backtick.
- Texto con `#` que no sea heading.

## 45.3 Reglas

- El frontmatter YAML no genera nodos.
- Los bloques de código no generan nodos.
- Un heading es nodo solo si aparece al inicio de línea y sigue sintaxis Markdown válida.
- Varios headings de nivel 1 generan múltiples raíces.
- Si el documento empieza con listas sin heading, se puede crear una raíz virtual o múltiples raíces de lista.
- Los saltos de heading, por ejemplo `#` a `###`, deben resolverse sin romper el árbol.
- Los tags no deben confundirse con headings.
- Los links deben conservarse en el texto del nodo.

## 45.4 Criterios de aceptación

- [ ] El parser acepta `-`, `*` y `+`.
- [ ] El parser acepta listas numeradas.
- [ ] El parser ignora frontmatter.
- [ ] El parser ignora bloques de código.
- [ ] El parser conserva links Markdown.
- [ ] El parser conserva wiki links.
- [ ] El parser no confunde tags con headings.
- [ ] El parser soporta múltiples raíces.
- [ ] El parser soporta documentos sin heading inicial.
- [ ] El parser no rompe documentos simples de Obsidian.

---

# 46. Persistencia visual en `localStorage`

## 46.1 Objetivo

Guardar preferencias visuales sin modificar el Markdown.

## 46.2 Estado visual persistente

```ts
interface VisualMapState {
  fileId: string
  layoutMode: LayoutMode
  collapsedNodeIds: string[]
  showDevelopedBranches: boolean
  manualPositions: Record<string, { x: number; y: number }>
  outlineVisible: boolean
  nodeWidthMode: NodeWidthMode
}
```

## 46.3 Claves recomendadas

```text
mdmap_layout
mdmap_outline_visible
mdmap_show_developed_branches
mdmap_collapsed_nodes_{fileId}
mdmap_manual_positions_{fileId}
mdmap_node_width
```

## 46.4 Identificador de archivo

Si existe ruta o handle del File System Access API, usarlo como base.

Si no existe, calcular hash estable del contenido inicial:

```ts
fileId = hash(fileName + initialMarkdownContent)
```

## 46.5 Limpieza

Al abrir un archivo:

- Se cargan posiciones manuales.
- Se eliminan IDs que ya no existen.
- Se eliminan colapsos de nodos inexistentes.
- Se valida el layout.
- Se valida `showDevelopedBranches`.

---

# 47. Criterios de aceptación ampliados

## 47.1 `developed`

- [ ] `developed` representa rama trabajada/completada.
- [ ] Marcar `developed` no implica necesariamente colapsar.
- [ ] Las ramas `developed` tienen indicador visual.
- [ ] Existe botón para mostrar/ocultar ramas desarrolladas.
- [ ] Si hay ramas desarrolladas ocultas, la UI lo indica.
- [ ] El usuario puede restaurar ramas ocultas con un clic.

## 47.2 Arquitectura

- [ ] `App.tsx` queda reducido a composición de hooks y componentes.
- [ ] `useMindMapStore` centraliza el estado principal.
- [ ] Existen hooks separados para layout, operaciones, colapso, portapapeles, historial, exportación y sincronización Markdown.
- [ ] Las operaciones estructurales pasan por hooks/store.

## 47.3 Exportación

- [ ] Existe acción de exportar PNG.
- [ ] Se puede exportar vista actual.
- [ ] Se puede exportar mapa completo.
- [ ] La exportación respeta ramas ocultas y desarrolladas.
- [ ] El viewport se restaura tras exportar.

## 47.4 Undo/redo

- [ ] Ctrl+Z / Cmd+Z funciona.
- [ ] Ctrl+Y y Ctrl+Shift+Z funcionan.
- [ ] Crear, borrar, editar, mover y marcar developed pueden deshacerse.
- [ ] El historial tiene límite máximo.

## 47.5 Movimiento manual

- [ ] Arrastrar nodos guarda posición.
- [ ] La posición se restaura al recargar.
- [ ] La posición se guarda en `localStorage`.
- [ ] Arrastrar nodos no modifica Markdown.
- [ ] Reorganizar tiene comportamiento claro sobre posiciones manuales.

## 47.6 Parser

- [ ] El parser soporta sintaxis habitual de Markdown y Obsidian.
- [ ] El parser ignora frontmatter y bloques de código.
- [ ] El parser soporta múltiples raíces.
- [ ] El parser no confunde tags con headings.

---

# 48. Priorización actualizada

## 48.1 Prioridad máxima

1. Semántica correcta de `developed`.
2. Botón mostrar/ocultar ramas desarrolladas.
3. Colapso/expansión manual de ramas.
4. Refactor de `App.tsx` en hooks.
5. Store real `useMindMapStore`.

## 48.2 Prioridad alta

6. Undo/redo.
7. Movimiento manual con persistencia en `localStorage`.
8. Exportar PNG.
9. Parser Markdown robusto.

## 48.3 Prioridad media

10. Exportar SVG.
11. Persistencia visual avanzada en sidecar `.mdmap.json`.
12. Acciones explícitas de cambio de jerarquía mediante drag and drop estructural.

---

# 49. Decisiones cerradas

Las siguientes decisiones quedan cerradas para esta versión:

1. `developed` significa rama trabajada/completada.
2. `developed` puede usarse para ocultar ramas ya trabajadas.
3. Debe existir botón para volver a mostrar ramas desarrolladas.
4. El colapso manual es independiente de `developed`.
5. Las posiciones manuales se guardan en `localStorage`.
6. Las posiciones manuales no se guardan en Markdown.
7. Arrastrar nodos no modifica la jerarquía ni el orden Markdown.
8. El store `useMindMapStore` debe dejar de ser un stub.
9. `App.tsx` debe reducirse mediante hooks especializados.
10. PNG es prioritario frente a SVG.
