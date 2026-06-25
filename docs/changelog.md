# Changelog

## v0.5.0 (2026-06-25)

### Nuevo

- **Estado tri-estado en nodos**: además de Pendiente (⬜) y Completado (✅), los nodos ahora admiten **En curso** (🟡). Se edita con un botón cíclico en el editor que alterna entre los tres estados.
- **Sintaxis Markdown `[~]`**: el estado "En curso" se serializa como `[~]` y se parsea correctamente.
- **Autocompletado de padres**: cuando todos los hijos de un nodo están completados, el padre se marca automáticamente como Completado.
- **Colores únicos para etiquetas**: cada etiqueta obtiene un color HSL generado por hash de su nombre, sin necesidad de registro previo.

### Cambiado

- **"Desarrollado" → "Completado"**: el checkbox del editor ahora es un botón cíclico (⬜ → 🟡 → ✅ → ⬜) con etiquetas "Pendiente", "En curso" y "Completada".
- **Indicador visual en canvas**: nodo pendiente muestra ⬜, en curso muestra 🟡 con borde ámbar, completado muestra ✅ con borde verde y etiqueta "Completada".
- **Panel de índice**: muestra ✅ o 🟡 según el estado del nodo.
- **Filtro de completadas**: oculta solo los nodos con estado 'done' (no afecta a 'in-progress').

### Corregido

- **Backspace ya no borra nodos**: ReactFlow sobrescribe `deleteKeyCode` para que solo la tecla `Delete` (Supr) elimine nodos. `Backspace` sigue funcionando normalmente dentro de campos de texto.
- **Textarea del cuerpo auto-redimensionable**: crece automáticamente al escribir sin necesidad de scroll manual.

### Técnico

- Nuevo tipo `DevState = 'todo' | 'in-progress' | 'done'` en `types.ts`.
- Función `parseDevState()` para compatibilidad con datos booleanos antiguos.
- `recomputeDeveloped` actualizado en hooks `useNodeOperations` y `useClipboard` para el nuevo tri-estado.

## v0.4.0 (2026-06-24)

### Nuevo

- **Tres modos de layout**: horizontal (compacto, por defecto), vertical (mejorado) y radial (circular). El horizontal está optimizado para mapas grandes, creciendo principalmente en vertical para evitar anchuras excesivas.
- **Selector de layout en toolbar**: botones para cambiar entre modos horizontal, vertical y radial con iconos distintivos.
- **Botón "Reorganizar mapa"**: reaplica el layout activo sobre todos los nodos visibles.
- **Plegado/desplegado de ramas**: botón de colapso en nodos con hijos, con indicador de descendientes ocultos (ej: "+12").
- **Persistencia de layout y colapso**: el modo de layout y los nodos colapsados se guardan en `localStorage` entre sesiones.
- **Ancho fijo de nodos**: los nodos tienen anchura máxima de 240px para evitar crecimiento horizontal desproporcionado. El contenido textual hace wrap automáticamente.
- **Panel lateral de índice (OutlinePanel)**: navegación jerárquica del mapa como árbol textual, con búsqueda y selección de nodos.
- **Filtros avanzados**: filtrado por texto (atenúa), etiquetas y niveles (ocultan no coincidentes). Las opciones de filtro permanecen visibles aunque los nodos estén ocultos.
- **Undo/Redo real**: historial completo con `Ctrl+Z` / `Ctrl+Y`, botones en toolbar, límite de 100 entradas.
- **Exportación PNG**: botón en toolbar, exporta la vista actual con fondo blanco.
- **Movimiento manual con persistencia**: las posiciones de nodos arrastrados se guardan en `localStorage` y se restauran al recargar.
- **Mejoras de navegación**: botones "Ver todo" y "Centrar selección" en la toolbar.
- **Edge types adaptados al layout**: `smoothstep` para horizontal/vertical, `bezier` para radial.
- **Indicador visible de nodos colapsados**: badge con estilo `primary` y número de descendientes ocultos.
- **Botón mostrar/ocultar cuerpo**: movido a la toolbar con icono 📄/📝.
- **Botón mostrar/ocultar desarrolladas**: en toolbar con iconos Check/Circle.
- **Zoom sin restricciones**: eliminado `minZoom` restrictivo, se permite zoom libre hasta 0.01x.
- **Parser robusto**: ignora frontmatter YAML (`---`) y bloques de código (triple backtick).
- **Hooks especializados**: `useLayoutMode`, `useCollapsedNodes`, `useMapFilters`, `useNodeOperations`, `useClipboard`, `useLayoutOperations`, `useMapExport`.
- **Algoritmos de layout optimizados**: implementación separada para cada modo en `src/lib/layout/`, con utilidades compartidas.

### Cambiado

- **`mdToNodes.ts`**: ahora acepta parámetro `layoutMode` para aplicar el layout deseado al parsear Markdown.
- **`MindMapNodeData`**: campos nuevos `hasChildren`, `isCollapsed`, `descendantsCount`, `layoutMode`.
- **`NodeCallbacksContext`**: añade callback opcional `onToggleCollapse` para manejar colapso desde nodos.
- **`Toolbar`**: rediseñado con grupos de controles (layout, undo/redo, vista, exportar, paneles, operaciones, colapso). Nuevo orden: Layout → Undo/Redo → Vista → Exportar → Paneles → Nodos → Colapso.
- **`NodeComponent`**: botón de colapso/expansión, contador de descendientes con badge, etiqueta "Completada" para ramas desarrolladas, ancho fijo de nodo, comparación `areNodePropsEqual` para rendimiento en drag.
- **`EdgeComponent`**: ahora lee `data.layoutMode` del edge para elegir entre `smoothstep` y `bezier`.
- **`MindMapCanvas`**: `fitView` controlado (no automático), `minZoom={0.01}`, `maxZoom={4}`.
- **`FileBar`**: eliminado campo de búsqueda (movido a FiltersPanel).
- **`FiltersPanel`**: simplificado, sin debounce, recibe todos los nodos para mantener opciones visibles.
- **`useMapFilters`**: añadido `setFilters` directo para actualización completa de estado.
- **Traducciones**: añadidas claves para layout, colapso, índice, filtros, exportación, cuerpo, desarrolladas, undo/redo en español e inglés.
- **Rendimiento**: `visibleNodes`, `processedNodes`, `processedEdges`, `matchesSearchText`, `hiddenNodeIds` envueltos en `useMemo`. `NodeComponent` con `React.memo` y comparación personalizada.

### Corregido

- **Solapes en mapas grandes**: el layout horizontal compacto evita que muchos hermanos ensanchen excesivamente el mapa.
- **fitView automático**: ya no se ejecuta permanentemente en cada render, solo en eventos controlados (cambio de layout, abrir archivo, acciones manuales).
- **Posiciones manuales**: implementada persistencia en `localStorage` con limpieza de obsoletas.
- **Parser Markdown**: robustez mejorada para frontmatter YAML, bloques de código, múltiples raíces.
- **Colapsar todo**: corregido (antes expandía en lugar de colapsar).
- **Filtros por nivel**: ahora sincronizan correctamente el estado con el panel.
- **Botón centrar selección**: corregido (usaba coordenadas del nodo en lugar de ID).
- **Reorden de toolbar**: botones de paneles movidos justo después de exportar PNG.

### Técnico

- **Arquitectura de layout**: carpeta `src/lib/layout/` con archivos separados para cada algoritmo y utilidades compartidas.
- **Tipos nuevos**: `LayoutMode`, `NodeWidthMode`, `MapFilters`, `HistorySnapshot`, `HistoryReason`, `HORIZONTAL_LAYOUT`, `VERTICAL_LAYOUT`, `RADIAL_LAYOUT`, `NODE_WIDTH_CONFIG` en `types.ts`.
- **Hooks personalizados**: `useNodeOperations` y `useClipboard` extraen ~180 líneas de lógica de `App.tsx`.
- **Tests unitarios**: suite de tests para algoritmos de layout, filtros y utilidades (Vitest).
- **Dependencias**: añadidas `lucide-react` (iconos), `html-to-image` (exportación PNG).
- **Memorización**: `useMemo` en todas las computaciones derivadas de nodos para evitar re-renders durante drag.

## v0.1.0 (2026-06-23)

### Nuevo

- **Título y cuerpo separados en nodos**: el texto del nodo se divide en título (primera línea) y cuerpo (resto). El cuerpo se edita con doble clic (campos separados "Título" y "Cuerpo"). El formato Markdown usa `- Título` y `| cuerpo` para las líneas de continuación, manteniendo compatibilidad con versiones anteriores.
- **Casilla "Cuerpo" en la barra superior**: activa/desactiva la visualización del cuerpo de todos los nodos a la vez en el lienzo (global). Por defecto solo se muestra el título.
- **Atajos `Tab` / `Shift+Tab`**: `Tab` añade un hijo al nodo seleccionado; `Shift+Tab` añade un hermano (mismo nivel/mismo padre). No actúan mientras se edita el texto de un nodo.
- **Tema claro/oscuro automático**: la aplicación respeta la preferencia del sistema (`prefers-color-scheme`). Los nodos, fondo, aristas y controles usan tokens de color en lugar de valores fijos.
- **Internacionalización (i18n)**: soporte nativo para Español e Inglés. La barra superior incluye un selector `ES`/`EN` que permite cambiar el idioma al instante. El idioma se persiste en `localStorage` y por defecto sigue el idioma del navegador. Todas las cadenas de la interfaz (barra superior, toolbar, editor de nodos, confirmaciones y contenido inicial) están traducidas.

### Cambiado

- **Editor de nodos**: ahora muestra dos campos — "Título del nodo" (input) y "Cuerpo del nodo" (textarea multilínea), más etiquetas y checkbox "Desarrollado".
- **Vista de nodos**: el título se muestra en negrita (`font-semibold`). El cuerpo es visible en el lienzo únicamente cuando la casilla **Cuerpo** de la barra superior está activada; por defecto permanece oculto y solo se ve dentro del editor al editar (doble clic).
- **Tipado de nodos**: introducido `MindMapNodeData` (`src/lib/types.ts`) usado por React Flow. Eliminados los casts `as any` sobre `node.data` (de ~18 a 4, todos sobre APIs del navegador no tipadas en TS).

### Corregido

- **Cancelación del selector de archivos colgaba la UI**: en navegadores sin File System Access API, si el usuario cancelaba "Abrir .md" la promesa nunca se resolvía y la interfaz quedaba bloqueada. Ahora el fallback rechaza con `AbortError` al detectar la cancelación.
- **Autoguardado silencioso en navegadores no compatibles**: el autoguardado programaba guardados que nunca se materializaban sin File System Access API (pérdida silenciosa de datos). Ahora el autoguardado solo actúa cuando existe un `FileSystemFileHandle` real; en el resto de casos el usuario debe guardar manualmente.
- **Round-trip Markdown no idempotente**: un nodo sin título se compilaba como `- [ ] Sin título`, mutando el archivo en cada ciclo abrir→guardar. Ahora se conserva el título vacío para que `abrir → guardar → abrir` no altere el contenido.
- **Documentación desincronizada**: `architecture.md` listaba Shadcn/ui (no es dependencia) y describía `useMindMapStore` como fuente de verdad (es un placeholder sin uso); los manuales describían el cuerpo como toggle por clic en el nodo (es una casilla global) y omitían/contradecían atajos. Actualizados README, architecture.md y manuales.
- **Código muerto**: eliminado `src/components/MarkdownEditor/` (nunca se importaba).

## v0.0.1 (2026-06-23)

Versión inicial de MDMap.

### Nuevo

- Mapa mental interactivo con React Flow.
- Edición de nodos con texto, etiquetas (`#tag`) y estado **desarrollado** (`[x]`/`[ ]`).
- Carga y guardado de mapas en formato Markdown indentado.
- Soporte para líneas de continuación con `|`.
- Copiar y pegar nodos con `Ctrl+C`/`Ctrl+V`. Al copiar, la selección original se limpia automáticamente.
- Selección múltiple con `Shift+Click`.
- Borrar nodos con `Delete` (confirma si tiene descendientes).
- Barra de búsqueda para filtrar nodos por texto o etiqueta (los no coincidentes se atenúan).
- Auto-ocultación del minimapa y controles de zoom (esquina inferior izquierda).
- Tecla `Tab` para acciones contextuales.
- Atajos de teclado: `Ctrl+S` guardar, `Ctrl+Z`/`Ctrl+Y` deshacer/rehacer (placeholder).
- Autoguardado diferido (1.5s tras cambios).

### Cambiado

- **Selección visual**: React Flow gestiona ahora la selección nativamente; se eliminó el override externo que lo impedía.
- **Copy/Delete multi-nodo**: operan sobre todos los nodos seleccionados simultáneamente, no solo el primero.
- **Pegar**: solo los nodos pegados quedan seleccionados; los originales se desseleccionan.
- **Ctrl+C/Ctrl+V**: se añadió `e.preventDefault()` para evitar que el navegador intercepte los atajos.
- **Delete**: ahora usa un ref (`selectedIdsRef`) para leer la selección en tiempo de evento, eliminando condiciones de carrera.
- **Creación de nodos**: `selected: true` explícito en addChild/addRoot/paste para sincronizar con React Flow.

### Eliminado

- **"Abrir carpeta"**: se eliminó el botón de la barra superior y toda la lógica asociada (`handleOpenDirectory`, `openDirectory`).
- **Redundancia en `saveFile`**: se eliminó el chequeo `!hasFS` que forzaba una descarga en vez de escribir al handle obtenido con `showSaveFilePicker`.

### Corregido

- **Guardado generaba archivos numerados**: cada clic en Guardar creaba un archivo nuevo con sufijo `(1)`, `(2)`, etc. Causado por `saveFile` ignorando el handle cuando `showOpenFilePicker` no estaba disponible, aunque sí lo estuviera `showSaveFilePicker`.
- **Parseo de `[x]`/`[ ]`**: el compilador ahora serializa correctamente el estado desarrollado.

### Técnico

- Versión del proyecto: `package.json` → `"version": "0.0.1"`.
- Servidor standalone `server.mjs` (sin dependencias externas, solo módulos nativos de Node.js).
- Script de compilación multiplataforma: genera `release/MDMap_v0.0.1.zip` con todos los archivos necesarios.
- `.gitignore` añadido.
- `favicon.svg` creado.
- Documentación actualizada: README, manual de usuario, manual de administrador.
- `dist/standalone.html`: archivo único con todo inlineado que funciona con `file://` en cualquier navegador sin necesidad de servidor.
- Posicionamiento del minimapa/controles movido a la esquina inferior izquierda.
- Eliminado "Abrir carpeta" de la interfaz; simplificado el flujo de guardado.
- Reparado `saveFile` para que siempre use el handle del archivo en lugar de caer a descarga.
