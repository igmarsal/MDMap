# Manual de administrador de MDMap v0.4.0

## Visión general

MDMap es una aplicación frontend construida con React, TypeScript, Vite, React Flow y Tailwind CSS. No requiere servidor backend. La persistencia se realiza mediante archivos Markdown abiertos desde el navegador, con soporte de `localStorage` para preferencias visuales y posiciones manuales.

## Requisitos del entorno

- Node.js 20 o superior
- npm
- Navegador basado en Chromium para acceso completo a archivos locales (Chrome, Edge, Brave)

En navegadores no compatibles con File System Access API, la apertura usa selector de archivo tradicional y el guardado usa descarga.

## Instalación

```bash
npm install
```

## Comandos disponibles

```bash
npm run dev       # Desarrollo con recarga automática
npm run build     # Compilación a dist/
npm run preview   # Vista previa de dist/
npm test          # Ejecutar tests unitarios (Vitest)
```

## Script multiplataforma

En `scripts/` se incluyen ejecutables para compilar y empaquetar la aplicación:

| Sistema | Archivo |
|---------|---------|
| Windows | `scripts/compilar-aplicacion.bat` |
| macOS | `scripts/compilar-aplicacion.command` |
| Linux | `scripts/compilar-aplicacion.sh` |

**Flujo del script**:
1. Ejecuta `npm install` si falta `node_modules`.
2. Ejecuta `npm run build`.
3. Lee la versión desde `package.json`.
4. Copia `dist/` + `server.mjs` a `release/MDMap/`.
5. Genera `release/MDMap_vX.X.X.zip`.

## Servidor standalone

El archivo `server.mjs` es un servidor HTTP sin dependencias externas (solo módulos nativos de Node.js). Se incluye en el ZIP de release.

```bash
cd ruta/de/la/aplicacion
node server.mjs [puerto] [host]
```

Por defecto sirve en `http://127.0.0.1:4173`.

## Estructura del proyecto

```text
src/
  App.tsx                         Composición principal del mapa (estado + hooks)
  components/
    FileBar.tsx                   Barra superior: archivo, idioma, abrir/guardar
    ui/                           Componentes de UI base (Button, etc.)
    mindmap/                      Lienzo, nodos, bordes, toolbar y paneles
      MindMapCanvas.tsx           Lienzo React Flow con fitView controlado
      NodeComponent.tsx           Nodo personalizado con colapso + editor
      EdgeComponent.tsx           Arista personalizada (smoothstep/bezier)
      Toolbar.tsx                 Barra de herramientas flotante completa
      NodeCallbacksContext.tsx    Contexto de callbacks de nodo
      OutlinePanel.tsx            Panel lateral de índice jerárquico
      FiltersPanel.tsx            Panel de filtros por texto, tags y niveles
  hooks/
    useNodeOperations.ts          Operaciones CRUD de nodos
    useClipboard.ts               Copiar/pegar con subárboles
    useLayoutMode.ts              Gestión y persistencia del modo de layout
    useCollapsedNodes.ts          Colapso/expansión de ramas
    useMapFilters.ts              Estado de filtros (texto, tags, niveles)
    useLayoutOperations.ts        Cambio y reorganización de layout
    useMapExport.ts               Exportación PNG
    useUndoRedo.ts                Historial snapshots (actualmente inline)
    useKeyboardShortcuts.ts       Atajos de teclado
    useAutoSave.ts                Autoguardado diferido
  lib/
    layout/                       Algoritmos de layout
      index.ts                    Punto de entrada y selector de layout
      layoutHorizontal.ts         Layout horizontal compacto
      layoutVertical.ts           Layout vertical mejorado
      layoutRadial.ts             Layout radial circular
      layoutUtils.ts              Utilidades (buildChildrenMap, toParsedNodes, etc.)
    compiler/nodesToMd.ts         Nodos → Markdown
    fileSystem/useFileSystem.ts   Apertura/guardado de archivos
    parser/mdToNodes.ts           Markdown → nodos (con layoutMode)
    filterUtils.ts                Utilidades de filtrado
    i18n.tsx                      Internacionalización (ES/EN)
    types.ts                      Tipos compartidos y constantes
  stores/useMindMapStore.tsx      Placeholder (pendiente de migrar)
  main.tsx                        Punto de entrada
  index.css                       Estilos y tema Tailwind
```

## Archivos críticos

### `src/App.tsx`

Coordina el estado del mapa mediante hooks especializados (`useNodeOperations`, `useClipboard`, `useLayoutMode`, `useCollapsedNodes`, `useMapFilters`). Gestiona archivo activo, conversión Markdown, autoguardado, historial inline y composición de componentes. Es la única fuente de verdad del estado del canvas (no hay store global en uso).

### `src/lib/layout/`

Contiene los tres algoritmos de layout en archivos separados:
- `layoutHorizontal.ts`: Raíz a la izquierda, crecimiento vertical.
- `layoutVertical.ts`: Raíz arriba, hijos abajo. Compacto.
- `layoutRadial.ts`: Raíz en el centro, distribución circular.

Cada función acepta `ParsedNode[]` y devuelve `Record<string, {x, y}>`.

### `src/lib/parser/mdToNodes.ts`

Convierte Markdown indentado en nodos. Soporta `[x]`/`[ ]` para estado desarrollado. Ignora frontmatter YAML y bloques de código. Acepta parámetro `layoutMode` para aplicar el layout deseado.

### `src/lib/compiler/nodesToMd.ts`

Convierte nodos en Markdown. Serializa `[x]`/`[ ]`. Los títulos vacíos se conservan para round-trip idempotente.

### `src/hooks/`

Cada hook encapsula una responsabilidad específica:
- `useNodeOperations`: addChild, addSibling, addRoot, deleteNodes, editNode, startEdit, stopEdit.
- `useClipboard`: copy, paste con manejo de subárboles y `recomputeDeveloped`.
- `useLayoutMode`: estado + persistencia del modo activo.
- `useCollapsedNodes`: toggle, collapseAll, expandAll, cleanup, persistencia.
- `useMapFilters`: filtros con `setFilters` directo.
- `useMapExport`: exportación PNG vía `html-to-image`.

### `src/stores/useMindMapStore.tsx`

Placeholder de contexto no conectado a la aplicación. Se conserva como semilla para una futura migración a un store real.

## Persistencia en localStorage

| Clave | Contenido |
|-------|-----------|
| `mdmap_layout` | Modo de layout activo |
| `mdmap_collapsed_nodes` | IDs de nodos plegados |
| `mdmap_manual_positions` | Posiciones arrastradas manualmente |
| `mdmap_lang` | Idioma seleccionado |

## Criterios de aceptación para nuevas versiones

1. `npm run build` sin errores.
2. Abrir la aplicación en Chrome y Firefox.
3. Crear un mapa con nodos, etiquetas y ramas.
4. Probar los tres modos de layout (horizontal, vertical, radial).
5. Probar colapso/expansión de ramas individual y global.
6. Probar filtros por texto, etiquetas y niveles.
7. Marcar/desmarcar estado desarrollado.
8. Probar Undo/Redo (Ctrl+Z / Ctrl+Y).
9. Probar exportación PNG.
10. Probar arrastrar nodos y recargar (persistencia de posición).
11. Verificar que el padre se actualiza automáticamente.
12. Guardar el `.md` y recargar la aplicación.
13. Abrir el `.md` guardado y confirmar que el mapa se reconstruye.
14. Probar copiar/pegar con selección simple y múltiple.
15. Probar borrar con y sin confirmación.
16. Verificar que el panel de índice y filtros se abren/cierran.
17. Ejecutar tests y verificar cobertura.

## Despliegue estático

La aplicación es completamente estática. Publicar el contenido de `dist/` (o `release/MDMap/` sin `server.mjs`) en cualquier servidor web.

## Limitaciones conocidas

- El acceso directo a archivos (y el autoguardado) requiere navegadores con File System Access API (Chromium).
- En navegadores no compatibles, la apertura usa el selector tradicional y el guardado usa descarga (crea un archivo nuevo cada vez). El autoguardado queda desactivado en ese caso.
- No existe autenticación ni sincronización en la nube.
- El tema (claro/oscuro) sigue la preferencia del sistema operativo (`prefers-color-scheme`); no hay conmutador manual.
- La internacionalización (i18n) usa un contexto React simple con diccionarios en `src/lib/i18n.tsx` y un selector `ES`/`EN` en la barra superior. Para añadir un idioma: extender el diccionario y añadir el botón en `FileBar.tsx`.
- El layout radial puede generar solapes en mapas muy asimétricos. No es recomendado para más de 30 nodos.

## Mantenimiento

```bash
npm update
npm install
npm run build
```

Después de actualizar dependencias, verificar:
- Arranque de desarrollo.
- Compilación de producción.
- Apertura y guardado de Markdown.
- Funcionamiento de React Flow.
- Tests unitarios.

## Solución de problemas

### `npm install` falla

```bash
rm -rf node_modules package-lock.json
npm install
```

### Fallo en compilación

```bash
npm run build
```

Revisar errores de TypeScript.

### La aplicación no guarda en la misma ruta

El navegador debe ser compatible con File System Access API y el usuario debe conceder permiso de escritura. Tras abrir un `.md`, el Guardar escribe directamente al mismo archivo.

### El Markdown no se interpreta correctamente

Formato esperado:

```markdown
- [ ] Idea central
  - [x] Rama completada
```
