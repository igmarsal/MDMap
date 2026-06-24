# Manual de usuario de MDMap v0.4.0

## Qué es MDMap

MDMap es una aplicación para crear mapas mentales visuales y guardarlos como archivos Markdown. Está pensada para organizar ideas, planes, tareas, apuntes o cualquier estructura jerárquica.

## Abrir la aplicación

### Modo desarrollo

```bash
npm run dev
```

Abrir `http://localhost:5173`.

### Modo compilado

```bash
npm run build
npm run preview
```

O usar el script de `scripts/` correspondiente al sistema operativo.

### Modo standalone (sin dependencias)

```bash
cd release/MDMap
node server.mjs
```

Abrir `http://127.0.0.1:4173`.

## Interfaz principal

- **Barra superior**: muestra el archivo activo (con indicador verde si hay un archivo abierto). Incluye selector de idioma **ES/EN**, y botones **Abrir .md** y **Guardar**.
- **Barra de herramientas flotante**: contiene todas las acciones organizadas por secciones.
- **Lienzo central**: muestra los nodos y las conexiones del mapa mental.
- **Paneles laterales**: índice del mapa (OutlinePanel) y filtros (FiltersPanel), se abren desde la toolbar.
- **Minimapa y controles de zoom**: aparecen al pasar el ratón por la esquina inferior izquierda.

## Modos de layout

La toolbar ofrece tres modos de disposición del mapa:

| Modo | Icono | Comportamiento |
|------|-------|----------------|
| **Horizontal** (por defecto) | `LayoutList` | Raíz a la izquierda, hijos hacia la derecha. Crece verticalmente. Ideal para mapas grandes. |
| **Vertical** | `LayoutGrid` | Raíz arriba, hijos hacia abajo. Compacto, similar al layout tradicional. |
| **Radial** | `Orbit` | Raíz en el centro, hijos en radios concéntricos. Visual y exploratorio. |

Para cambiar de modo: haz clic en el icono correspondiente en la toolbar. El cambio de layout recalcula las posiciones de todos los nodos automáticamente y ejecuta `fitView`.

**Botón "Reorganizar"**: reaplica el layout activo sobre los nodos visibles, útil después de añadir/quitar nodos sin cambiar de modo.

## Crear un mapa

Al iniciar la aplicación aparece un mapa inicial con una idea central y dos ramas.

**Nodo raíz**: pulsa **+ Raíz** en la barra de herramientas.

**Nodo hijo**:
1. Selecciona el nodo padre.
2. Pulsa **+ Hijo** en la barra de herramientas, o el botón `+` sobre el nodo seleccionado.

## Editar nodos

Haz doble clic sobre un nodo. Se abre un panel con:

- **Título** del nodo (campo de texto, primera línea).
- **Cuerpo** del nodo (textarea multilínea, visible al hacer clic en el nodo cuando no está en edición).
- **Etiquetas** separadas por coma.
- **Check "Desarrollado"**: marca si el nodo está completado. El padre se marca automáticamente si todos sus hijos lo están.
- **Aceptar** (`Ctrl+Enter`/`Cmd+Enter`) o **Cancelar** (`Escape`).

## Ver cuerpo del nodo

Por defecto los nodos muestran solo el título en negrita. Para mostrar también el cuerpo de todos los nodos:

1. Pulsa el botón 📄/📝 en la toolbar (sección de paneles).
2. Cada nodo que tenga cuerpo lo mostrará debajo del título, en un tono más tenue.
3. Vuelve a pulsarlo para ocultar los cuerpos.

El cuerpo se edita con doble clic sobre el nodo (campo "Cuerpo del nodo"). El cuerpo se guarda como líneas de continuación (`|`) en el Markdown.

## Plegado/desplegado de ramas

Los nodos que tienen hijos muestran un chevron (▶/▼) a su izquierda:

- **Plegar**: haz clic en ▼ para ocultar todos los descendientes del nodo.
- **Desplegar**: haz clic en ▶ para volver a mostrar los descendientes.

Cuando una rama está plegada, el nodo muestra un badge con el número de nodos ocultos (ej: `+12`).

**Botones globales en toolbar**:
- **Expandir todo** (▼): despliega todas las ramas.
- **Colapsar todo** (▶): pliega todos los nodos con hijos.

El estado de colapso se guarda en `localStorage` y persiste entre sesiones.

## Filtros

Abre el panel de filtros desde la toolbar (icono `Filter`). Ofrece:

- **Búsqueda por texto**: filtra nodos cuyo título o etiquetas contengan el texto. Los no coincidentes se **atenúan** (siguen visibles).
- **Etiquetas**: selecciona una o varias etiquetas. Los nodos sin esas etiquetas se **ocultan**.
- **Niveles**: selecciona uno o varios niveles. Los nodos de otros niveles se **ocultan**.
- **Ramas desarrolladas**: toggle para mostrar u ocultar ramas marcadas como completadas.
- **Limpiar filtros**: restaura la vista completa.

Las opciones de filtro disponibles (tags, niveles) se muestran aunque los nodos correspondientes estén ocultos.

## Panel de índice (OutlinePanel)

Abre el panel de índice desde la toolbar (icono `ListTree`). Muestra la estructura del mapa como árbol textual jerárquico:

- Haz clic en un elemento para **seleccionar** el nodo y **centrarlo** en el canvas.
- Respeta el estado de ramas plegadas.
- Incluye campo de búsqueda dentro del panel.

## Deshacer y rehacer

| Acción | Atajo | Botón |
|--------|-------|-------|
| Deshacer | `Ctrl + Z` / `Cmd + Z` | `Undo2` |
| Rehacer | `Ctrl + Y` / `Cmd + Y` | `Redo2` |

El historial almacena hasta 100 acciones (crear, borrar, editar, mover, cambiar layout, colapsar, pegar). Se limpia al abrir un archivo nuevo.

## Exportar PNG

Pulsa el botón `Image` en la toolbar para exportar la vista actual del canvas como PNG. El archivo se descarga como `mdmap_{nombre_del_archivo}.png`.

## Indicador visual

Cada nodo muestra:
- ✅ / ⬜ (desarrollado / no desarrollado).
- Borde de color según nivel y etiqueta. Los nodos desarrollados usan borde verde.
- Etiqueta "Completada" en los nodos desarrollados.

## Etiquetas

Se escriben separadas por coma en el editor, o directamente en Markdown con `#`:

```markdown
- Tarea importante #importante #urgente
```

Colores por defecto: `central` (rojo), `importante` (ámbar), `urgente` (rojo), `idea` (azul), `hecho` (verde), `pregunta` (púrpura), `decision` (rosa).

## Seleccionar, mover y conectar

- **Seleccionar**: haz clic sobre un nodo, o arrastra una caja de selección sobre el lienzo.
- **Selección múltiple**: `Shift` + clic sobre varios nodos.
- **Mover**: arrastra el nodo dentro del lienzo. Las posiciones se guardan en `localStorage` y se restauran al recargar la aplicación. Si hay varios seleccionados, se mueven juntos.
- **Conectar**: arrastra desde el conector inferior de un nodo hasta otro nodo.

> Nota: arrastrar nodos no modifica la jerarquía del Markdown. Solo cambia la posición visual.

## Copiar y pegar

1. Selecciona uno o varios nodos (`Shift+Click` para varios).
2. `Ctrl+C` / **Copiar**. La selección original se limpia automáticamente.
3. `Ctrl+V` / **Pegar**. Los nodos copiados aparecen ligeramente desplazados y quedan seleccionados.

La copia incluye los nodos seleccionados y todos sus descendientes.

## Borrar nodos

Selecciona el nodo y pulsa `Delete` o **✕ Borrar**. Si tiene descendientes, la aplicación pide confirmación.

## Abrir archivos Markdown

Pulsa **Abrir .md** en la barra superior. Si ya hay un archivo abierto, el botón muestra **Cambiar archivo...**.

El archivo queda vinculado: al pulsar **Guardar** se escribe directamente en el mismo archivo sin mostrar el selector de nuevo.

Se soportan:
- Headings `#`, `##`, etc.
- Listas con `-`, `*`, `+`.
- Listas numeradas.
- Frontmatter YAML (se ignora).
- Bloques de código (se ignoran).
- Tags `#tag`.
- Links Markdown y wiki links de Obsidian `[[Página]]`.

## Guardar

Pulsa **Guardar** en la barra superior. Si hay un archivo abierto, se guarda directamente. Si no, se muestra el selector para elegir ubicación.

El autoguardado también guarda cambios tras unos segundos de inactividad, pero solo cuando el archivo se abrió con la File System Access API (navegadores Chromium). En otros navegadores, o si el archivo se abrió por el selector tradicional, debes guardar manualmente con el botón **Guardar** (se descargará un archivo nuevo).

## Atajos de teclado

| Acción | Atajo |
|--------|-------|
| Guardar | `Ctrl + S` / `Cmd + S` |
| Deshacer | `Ctrl + Z` / `Cmd + Z` |
| Rehacer | `Ctrl + Y` / `Cmd + Y` / `Ctrl + Shift + Z` |
| Copiar | `Ctrl + C` / `Cmd + C` |
| Pegar | `Ctrl + V` / `Cmd + V` |
| Borrar nodo seleccionado | `Delete` |
| Añadir hijo al nodo seleccionado | `Tab` |
| Añadir hermano del nodo seleccionado | `Shift + Tab` |
| Aceptar edición | `Ctrl + Enter` / `Cmd + Enter` |
| Cancelar edición | `Escape` |
| Selección múltiple | `Shift` + clic |

> Los atajos de edición (Copiar, Pegar, Tab) requieren tener un nodo seleccionado y no funcionan mientras se edita el texto de un nodo.

## Formato Markdown

Los mapas se guardan como listas indentadas. Cada nodo tiene un título (primera línea con `-`) y un cuerpo opcional (líneas de continuación con `|`).

```markdown
- [ ] Título del nodo #central
  | Primera línea del cuerpo
  | Segunda línea del cuerpo
  - [x] Hijo completado #hecho
    | Cuerpo del hijo
```

Reglas:
- Cada línea que empieza con `-` crea un nodo (el texto es el título).
- `[x]` o `[ ]` indican el estado desarrollado.
- La indentación (2 espacios) determina el nivel.
- Las etiquetas se escriben con `#`.
- Las líneas de continuación empiezan con `|` y forman el cuerpo del nodo.
- El cuerpo se muestra en el lienzo al activar el botón **Cuerpo** en la toolbar.
- El frontmatter YAML (entre `---`) se ignora.
- Los bloques de código (triple backtick) se ignoran.

## Consejos

- Usa el layout **horizontal** para mapas grandes. Crece verticalmente sin ensancharse.
- **Piega ramas** irrelevantes para reducir ruido visual mientras trabajas.
- Usa **filtros por etiquetas** para centrarte en un tipo de nodos.
- Arrastra nodos para personalizar la disposición; las posiciones se guardan automáticamente.
- Usa `[x]`/`[ ]` para marcar progreso y el toggle de **desarrolladas** para ocultar ramas completadas.
- Guarda el archivo con frecuencia si el navegador no permite acceso directo al sistema de archivos.
