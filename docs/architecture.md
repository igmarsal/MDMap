# Arquitectura de MDMap

## Visión General

MDMap es una aplicación React moderna para crear, visualizar y gestionar mapas mentales basados en Markdown. La arquitectura está diseñada para ser modular, extensible y mantenible, con separación clara de responsabilidades.

## Stack Tecnológico

- **Frontend**: React 18+ con TypeScript
- **Estado**: React Hooks + Context API
- **Mapas**: ReactFlow
- **Layout**: Algoritmos personalizados (horizontal, vertical, radial)
- **Estilos**: Tailwind CSS
- **Tests**: Vitest + React Testing Library
- **Build**: Vite

## Estructura del Proyecto

```
src/
├── components/
│   ├── mindmap/
│   │   ├── NodeComponent.tsx      # Componente de nodo visual
│   │   ├── EdgeComponent.tsx      # Componente de arista
│   │   ├── MindMapCanvas.tsx      # Canvas principal de ReactFlow
│   │   ├── Toolbar.tsx            # Barra de herramientas
│   │   ├── Controls.tsx           # Controles de zoom/pan
│   │   ├── OutlinePanel.tsx       # Panel de índice
│   │   ├── FiltersPanel.tsx       # Panel de filtros
│   │   └── NodeCallbacksContext.tsx # Contexto de callbacks de nodos
│   ├── ui/
│   │   └── Button.tsx             # Componente de botón reutilizable
│   └── FileBar.tsx                # Barra de operaciones de archivo
├── hooks/
│   ├── useLayoutMode.ts           # Gestión de modo de layout
│   ├── useCollapsedNodes.ts       # Gestión de colapso de ramas
│   ├── useMapFilters.ts           # Gestión de filtros
│   ├── useLayoutOperations.ts     # Operaciones de layout
│   ├── useUndoRedo.ts             # Gestión de historial
│   ├── useMapExport.ts            # Exportación a PNG
│   ├── useAutoSave.ts             # Autoguardado diferido
│   ├── useKeyboardShortcuts.ts    # Atajos de teclado
│   └── useFileSystem.ts           # Sistema de archivos
├── lib/
│   ├── types.ts                   # Tipos TypeScript compartidos
│   ├── i18n.tsx                   # Sistema de internacionalización
│   ├── compiler/
│   │   └── nodesToMd.ts           # Compilador nodos → Markdown
│   ├── parser/
│   │   └── mdToNodes.ts           # Parser Markdown → nodos
│   ├── layout/
│   │   ├── index.ts               # Exportación de layout
│   │   ├── layoutHorizontal.ts    # Layout horizontal
│   │   ├── layoutVertical.ts      # Layout vertical
│   │   ├── layoutRadial.ts        # Layout radial
│   │   └── layoutUtils.ts         # Utilidades de layout
│   ├── fileSystem/
│   │   └── useFileSystem.ts       # Hooks de sistema de archivos
│   └── filterUtils.ts             # Utilidades de filtrado
└── App.tsx                        # Componente principal
```

## Principios de Diseño

### 1. Separación de Responsabilidades

Cada componente y hook tiene una responsabilidad única y bien definida:

- **Componentes**: Renderizan UI y manejan interacciones locales
- **Hooks**: Encapsulan lógica de negocio y estado complejo
- **Utilidades**: Funciones puras sin efectos secundarios
- **Servicios**: Operaciones asíncronas y acceso a APIs externas

### 2. Composición sobre Herencia

Los componentes están diseñados para ser compuestos:

```tsx
<App>
  <FileBar />
  <Toolbar />
  <MindMapCanvas>
    <OutlinePanel />
    <FiltersPanel />
  </MindMapCanvas>
</App>
```

### 3. Hooks Personalizados

La lógica compleja se extrae en hooks reutilizables:

```ts
const layout = useLayoutMode()
const collapsedNodes = useCollapsedNodes()
const filters = useMapFilters()
const export = useMapExport()
```

## Arquitectura de Estado

### Estado Local (Componentes)

Para estado efímero y simple:

```ts
const [isHovered, setIsHovered] = useState(false)
const [localQuery, setLocalQuery] = useState('')
```

### Estado Global (App)

Para estado que afecta a múltiples componentes:

```ts
const [nodes, setNodes] = useState<Node[]>([])
const [edges, setEdges] = useState<Edge[]>([])
const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal')
```

### Estado Persistente (localStorage)

Para preferencias de usuario:

```ts
const getInitialLayoutMode = (): LayoutMode => {
  const saved = localStorage.getItem('mdmap_layout') as LayoutMode | null
  return saved || 'horizontal'
}
```

### Fuentes de Verdad

1. **Markdown**: Fuente de verdad para contenido y jerarquía
2. **ReactFlow/Store**: Fuente de verdad para posición visual, selección, zoom
3. **localStorage**: Fuente de persistencia para preferencias visuales

## Sistema de Layout

### Arquitectura

```
mdToNodes (parser)
    ↓
ParsedNode[]
    ↓
calculateLayout (mode)
    ↓
applyLayout
    ↓
Positions Map
    ↓
ReactFlow Nodes
```

### Modos de Layout

#### Horizontal (Predeterminado)
- Raíz a la izquierda, hijos hacia la derecha
- Crecimiento principalmente vertical
- Ideal para mapas grandes

#### Vertical
- Raíz arriba, hijos hacia abajo
- Más compacto que el diseño tradicional
- Ideal para mapas pequeños

#### Radial
- Raíz en el centro, hijos en círculos concéntricos
- Visual y exploratorio
- No recomendado para mapas muy grandes

### Algoritmos

Los algoritmos de layout siguen este patrón:

```ts
function calculateLayoutX(nodes: ParsedNode[]): Record<string, Position> {
  const positions: Record<string, Position> = {}
  const childrenOf = buildChildrenMap(nodes)

  function placeNode(node: ParsedNode, context: LayoutContext): void {
    // Calcular posición del nodo
    positions[node.id] = calculatePosition(node, context)

    // Colocar hijos recursivamente
    const children = childrenOf.get(node.id) || []
    children.forEach(child => placeNode(child, nextContext))
  }

  // Colocar raíces
  const roots = childrenOf.get(ROOT_KEY) || []
  roots.forEach(root => placeNode(root, initialContext))

  return positions
}
```

## Sistema de Filtrado

### Tipos de Filtros

1. **Filtro por texto**: Búsqueda en título y cuerpo
2. **Filtro por etiquetas**: Filtrado por tags `#tag`
3. **Filtro por nivel**: Filtrado por profundidad en el árbol
4. **Filtro de desarrolladas**: Ocultar/mostrar ramas completadas

### Proceso de Filtrado

```ts
// 1. Obtener nodos que coinciden con filtros
const filteredIds = getFilteredNodeIds(nodes, filters)

// 2. Obtener nodos ocultos por colapso
const hiddenIds = getHiddenDescendantIds(collapsedNodeIds, edges)

// 3. Obtener ramas desarrolladas
const developedIds = getDevelopedBranchNodeIds(nodes, edges)

// 4. Combinar y aplicar
const visibleNodes = nodes.filter(node =>
  filteredIds.has(node.id) &&
  !hiddenIds.has(node.id) &&
  (showDevelopedBranches || !developedIds.has(node.id))
)
```

## Sistema de Colapso/Expansión

### Estado

```ts
interface CollapseState {
  collapsedNodeIds: Set<string>
  toggleCollapse: (nodeId: string) => void
  expandAll: () => void
  collapseAll: () => void
}
```

### Implementación

1. **Botón en nodo**: Chevron para plegar/desplegar
2. **Indicador**: Contador de descendientes ocultos
3. **Persistencia**: Guardado en `localStorage`
4. **Visualización**: Los nodos ocultos no se envían a ReactFlow

## Sistema de Historial (Undo/Redo)

### Estructura del Snapshot

```ts
interface HistorySnapshot {
  nodes: Node[]
  edges: Edge[]
  markdown: string
  layoutMode: LayoutMode
  collapsedNodeIds: string[]
  showDevelopedBranches: boolean
  manualPositions: Record<string, Position>
  timestamp: number
  reason: HistoryReason
}
```

### Razones de Cambio

- `add-node`: Creación de nodo
- `delete-node`: Borrado de nodo
- `edit-node`: Edición de texto
- `move-node`: Movimiento manual
- `change-layout`: Cambio de modo de layout
- `collapse-node`/`expand-node`: Colapso/expansión
- `toggle-developed`: Cambio de estado desarrollado

### Limitaciones

- Máximo 100 snapshots en historial
- No incluye zoom, pan, selección
- Se limpia al abrir archivo nuevo

## Sistema de Exportación

### Formatos

- **PNG**: Exportación actual
- **SVG**: Futuro (no implementado)

### Opciones

- `current`: Vista actual
- `full`: Mapa completo
- `selection`: Solo nodos seleccionados
- `background`: Blanco o transparente

### Implementación

```ts
const { exportToPng } = useMapExport()

// Exportar vista actual
const blob = await exportToPng(container, {
  format: 'png',
  scope: 'current',
  background: 'white'
})
```

## Internacionalización (i18n)

### Arquitectura

```ts
interface Translations {
  [lang: string]: {
    [key: string]: string
  }
}

const I18nContext = createContext<I18nContextType>()
```

### Uso

```ts
const { t, lang, setLang } = useI18n()

// Traducción simple
const text = t('save')

// Traducción con variables
const text = t('deleteConfirm', { count: 5 })

// Pluralización
const text = t('nodes', { count: count === 1 ? 1 : 2 })
```

## Sistema de Archivos

### File System Access API

Para Chrome/Edge con soporte nativo:

```ts
const handle = await showSaveFilePicker({
  types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }]
})
await handle.write(contents)
```

### Fallback

Para navegadores sin soporte:

```ts
const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = filename
a.click()
```

## Atajos de Teclado

### Implementación

```ts
useKeyboardShortcuts({
  onSave: handleSave,
  onDelete: handleDelete,
  onCopy: handleCopy,
  onPaste: handlePaste,
  onAddChild: handleAddChild,
  onAddSibling: handleAddSibling,
})
```

### Atajos Definidos

- `Ctrl+S` / `Cmd+S`: Guardar
- `Delete`: Borrar nodos seleccionados
- `Ctrl+C` / `Cmd+C`: Copiar
- `Ctrl+V` / `Cmd+V`: Pegar
- `Tab`: Añadir hijo
- `Shift+Tab`: Añadir hermano
- `Escape`: Cancelar edición
- `Ctrl+Enter` / `Cmd+Enter`: Aceptar edición

## Rendimiento

### Optimizaciones

1. **Memoización**: `useMemo` para cálculos costosos
2. **Callbacks**: `useCallback` para estabilidad de referencias
3. **Virtualización**: ReactFlow maneja el renderizado de nodos
4. **Debounce**: Búsqueda con debounce de 300ms
5. **Lazy Loading**: Componentes cargados bajo demanda

### Mejores Prácticas

- Evitar re-renders innecesarios
- Usar refs para valores que no triggeran re-renders
- Mantener estado cerca de donde se usa
- Dividir componentes grandes

## Testing

### Estrategia

- **Unit Tests**: Lógica de negocio pura
- **Integration Tests**: Flujo de componentes
- **E2E Tests**: Flujos completos (futuro)

### Herramientas

- **Vitest**: Framework de testing
- **React Testing Library**: Testing de componentes
- **Vi**: Mocking

### Ejemplo de Test

```ts
describe('Horizontal Layout', () => {
  it('should layout a simple tree', () => {
    const nodes: ParsedNode[] = [...]
    const positions = calculateLayoutHorizontal(nodes)

    expect(positions['root']).toBeDefined()
    expect(positions['root'].x).toBe(0)
  })
})
```

## Seguridad

### Consideraciones

1. **Sanitización**: El contenido de nodos se escapa
2. **Validación**: Entradas de usuario validadas
3. **CORS**: Configurado correctamente para File System Access API
4. **XSS**: React escapa automáticamente contenido JSX

## Accesibilidad

### Características

1. **Atributos ARIA**: En componentes interactivos
2. **Navegación por teclado**: Atajos y foco
3. **Contraste**: Tokens de color accesibles
4. **Screen readers**: Estructura semántica

## Roadmap de Arquitectura

### Corto Plazo

- [ ] Completar integración de hooks en App.tsx
- [ ] Tests de integración para flujos principales
- [ ] Mejoras de performance para mapas grandes

### Medio Plazo

- [ ] SVG export
- [ ] Drag and drop estructural
- [ ] Layout automático con librerías externas

### Largo Plazo

- [ ] Edición colaborativa
- [ ] Sincronización remota
- [ ] Plugins y extensiones

## Convenciones de Código

### Estilo

- **TypeScript**: Estricto
- **Prettier**: Formateo automático
- **ESLint**: Linting estricto
- **Convenciones**: React + TypeScript

### Nomenclatura

- **Componentes**: PascalCase (`MindMapNode`)
- **Hooks**: camelCase con prefijo `use` (`useLayoutMode`)
- **Funciones**: camelCase (`calculateLayout`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_HISTORY`)
- **Interfaces**: PascalCase (`MindMapNodeData`)

### Organización de Archivos

- **Componentes**: Un componente por archivo
- **Hooks**: Un hook por archivo
- **Utilidades**: Agrupadas por funcionalidad
- **Tipos**: En `types.ts` o cerca de su uso

## Conclusiones

MDMap sigue una arquitectura moderna y escalable que permite:

- **Mantenibilidad**: Código organizado y documentado
- **Extensibilidad**: Fácil añadir nuevas funcionalidades
- **Performance**: Optimizaciones para manejar mapas grandes
- **UX**: Experiencia de usuario fluida y consistente
- **Testabilidad**: Código testable y probado

La separación de responsabilidades y el uso de hooks personalizados hacen que el código sea limpio, reutilizable y fácil de mantener.