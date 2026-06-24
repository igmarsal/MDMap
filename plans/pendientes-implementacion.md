# Plan de implementación: Pendientes MDMap v0.4.0

**Estado:** 2026-06-24 18:52 — Basado en `especificacion-unificada-mejoras-mdmap-actualizada.md`

---

## ✅ Fase A: Correcciones inmediatas (prioridad máxima) — COMPLETADA

### A.1 — Integrar Undo/Redo ✅
- [x] Historial implementado con refs (`historyRef`, `futureRef`)
- [x] `pushHistory()` llamado antes de cada operación (addChild, addSibling, addRoot, deleteNodes, editNode, changeLayout)
- [x] Atajos `Ctrl+Z` / `Ctrl+Y` en `useKeyboardShortcuts`
- [x] Botones Deshacer/Rehacer en Toolbar con iconos `Undo2`/`Redo2`
- [x] Límite de 100 entradas en historial
- [x] Historial se limpia al abrir archivo nuevo

### A.2 — Exportación PNG ✅
- [x] Hook `useMapExport` integrado en App.tsx
- [x] Botón Exportar en Toolbar (icono `Image`)
- [x] Exporta vista actual con fondo blanco vía `html-to-image`
- [x] Descarga como `mdmap_{filename}.png`
- [x] Canvas container ref para captura del viewport

### A.3 — Movimiento manual con persistencia ✅
- [x] Estado `manualPositions` en App.tsx
- [x] `onNodeDragStop` captura posición final del nodo
- [x] Persistencia en `localStorage` clave `mdmap_manual_positions`
- [x] Al cargar archivo, se aplican posiciones guardadas sobre el layout calculado
- [x] Limpieza de posiciones obsoletas (nodos que ya no existen)

### A.4 — Parser robusto ✅
- [x] Ignorar frontmatter YAML (líneas entre `---` al inicio del archivo)
- [x] Ignorar bloques de código (triple backtick `` ``` ``)
- [x] Filtrado previo al parseo, no altera la lógica existente

---

## 🔧 Mejoras adicionales implementadas (no planificadas originalmente)

### M.1 — Filtros de etiquetas y niveles ✅
- [x] Tags y niveles ahora **ocultan** nodos no coincidentes (antes solo atenuaban)
- [x] Búsqueda por texto sigue atenuando (no oculta)
- [x] Panel de filtros recibe todos los nodos para mantener opciones visibles
- [x] Flujo simplificado: `setFilters` directo, sin debounce ni diffing manual

### M.2 — Rendimiento ✅
- [x] `hiddenNodeIds`, `visibleNodes`, `matchesSearchText`, `processedNodes`, `processedEdges` envueltos en `useMemo`
- [x] `areNodePropsEqual` en `React.memo` de `NodeComponent` para evitar re-renders durante drag
- [x] Solo se recalcula `processedNodes` cuando cambian dependencias relevantes

### M.3 — Zoom y visualización ✅
- [x] Eliminado `minZoom` restrictivo en `fitView` (ahora sin límite inferior)
- [x] Añadido `minZoom={0.01}` / `maxZoom={4}` en ReactFlow para libertad de zoom
- [x] `padding` aumentado a 0.3 en `fitView`

### M.4 — Toolbar y UI ✅
- [x] Botones de paneles (cuerpo, desarrolladas, esquema, filtros) movidos justo después de Exportar PNG
- [x] Colapsar todo ahora colapsa TODOS los nodos con hijos
- [x] Indicador de nodos colapsados con badge primary `+N`

### M.5 — Colapso/expansión corregido ✅
- [x] `collapseAll` en hook arreglado: añade nodos al Set en lugar de eliminarlos
- [x] `handleCollapseAll` usa `edgesRef.current` directamente para detectar fuentes
- [x] `handleExpandAll` simplificado sin dependencias innecesarias

---

## 📋 Fase B: Refactor de estado (prioridad alta)

### B.1 — Hook `useNodeOperations` ✅ COMPLETADO
- [x] Extraer toda la lógica de addChild, addSibling, addRoot, deleteNodes, editNode, startEdit, stopEdit
- [x] Aceptar referencias a nodesRef, edgesRef, setNodes, setEdges, etc.
- [x] Integrar en App.tsx reemplazando las funciones inline (~120 líneas eliminadas)

### B.2 — Hook `useClipboard` ✅ COMPLETADO
- [x] Extraer lógica de copy/paste con manejo de subárboles
- [x] Gestión de `clipboardRef` (useRef) y `hasClipboard` (useState)
- [x] Mapeo de IDs al pegar
- [x] Integrar en App.tsx reemplazando inline (~60 líneas eliminadas)

### B.3 — Hook `useMarkdownSync` (estimado: 1h) ❌ PENDIENTE
- [ ] Extraer lógica de sincronización: `dirtyRef`, `scheduleSave`, `handleSave`, `doSave`
- [ ] Gestión de `handleRef` (FileSystemFileHandle)
- [ ] Descarga de fallback cuando no hay File System Access API

### B.4 — Store real `useMindMapStore` (estimado: 3-4h) ❌ PENDIENTE
- [ ] Implementar acciones del store con estado real (no stub)
- [ ] Migrar App.tsx para usar el store como fuente de verdad
- [ ] Mantener compatibilidad con el estado local existente durante la migración

---

## 📋 Fase C: Mejoras UI (prioridad media) — PARCIAL

### C.1 — Adaptar tipo de edge por layout ✅ COMPLETADA
- [x] `EdgeComponent.tsx` lee `data.layoutMode` de cada edge
- [x] Usa `getSmoothStepPath` para layout horizontal/vertical
- [x] Usa `getBezierPath` para layout radial

### C.2 — Exportación SVG ❌ PENDIENTE
- [ ] Implementar como alternativa a PNG en hook `useMapExport`
- [ ] Botón separado o submenú en toolbar

### C.3 — Animaciones de transición entre layouts ❌ PENDIENTE
- [ ] Opcional: suavizar cambio de posición con animaciones CSS (`transition` en nodos)

---

## 📊 Resumen de esfuerzo restante

| Fase | Items | Prioridad | Esfuerzo |
|------|-------|-----------|----------|
| B.1 | Hook `useNodeOperations` | Alta | ✅ Completado |
| B.2 | Hook `useClipboard` | Alta | ✅ Completado |
| B.3 | Hook `useMarkdownSync` | Alta | ~1h |
| B.4 | Store `useMindMapStore` | Alta | ~3-4h |
| C.2 | Exportación SVG | Media | ~1h |
| C.3 | Animaciones layout | Baja | ~1-2h |
| **Total** | **4 items** | | **~6-8h** |
