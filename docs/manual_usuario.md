# Manual de usuario de MDMap v0.0.1

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

- **Barra superior**: muestra el archivo activo (con indicador verde si hay un archivo abierto). Incluye botones **Abrir .md**, **Guardar** y campo de búsqueda.
- **Barra de herramientas flotante**: permite añadir nodos raíz, hijos, copiar, pegar y borrar.
- **Lienzo central**: muestra los nodos y las conexiones del mapa mental.
- **Minimapa y controles de zoom**: aparecen al pasar el ratón por la esquina inferior izquierda.

## Crear un mapa

Al iniciar la aplicación aparece un mapa inicial con una idea central y dos ramas.

**Nodo raíz**: pulsa **+ Raíz** en la barra de herramientas.

**Nodo hijo**:
1. Selecciona el nodo padre.
2. Pulsa **+ Hijo** en la barra de herramientas, o el botón `+` sobre el nodo seleccionado.

## Editar nodos

Haz doble clic sobre un nodo. Se abre un panel con:

- **Texto** del nodo (textarea multilínea).
- **Etiquetas** separadas por coma.
- **Check "Desarrollado"**: marca si el nodo está completado. El padre se marca automáticamente si todos sus hijos lo están.
- **Aceptar** (`Ctrl+Enter`/`Cmd+Enter`) o **Cancelar** (`Escape`).

## Indicador visual

Cada nodo muestra:
- ✅ / ⬜ (desarrollado / no desarrollado).
- Borde de color según nivel y etiqueta. Los nodos desarrollados usan borde verde.

## Etiquetas

Se escriben separadas por coma en el editor, o directamente en Markdown con `#`:

```markdown
- Tarea importante #importante #urgente
```

Colores por defecto: `central` (rojo), `importante` (ámbar), `urgente` (rojo), `idea` (azul), `hecho` (verde), `pregunta` (púrpura), `decision` (rosa).

## Seleccionar, mover y conectar

- **Seleccionar**: haz clic sobre un nodo.
- **Selección múltiple**: `Shift` + clic sobre varios nodos.
- **Mover**: arrastra el nodo dentro del lienzo. Si hay varios seleccionados, se mueven juntos.
- **Conectar**: arrastra desde el conector inferior de un nodo hasta otro nodo.

## Copiar y pegar

1. Selecciona uno o varios nodos (`Shift+Click` para varios).
2. `Ctrl+C` / **Copiar**. La selección original se limpia automáticamente.
3. `Ctrl+V` / **Pegar**. Los nodos copiados aparecen ligeramente desplazados y quedan seleccionados.

La copia incluye los nodos seleccionados y todos sus descendientes.

## Borrar nodos

Selecciona el nodo y pulsa `Delete` o **✕ Borrar**. Si tiene descendientes, la aplicación pide confirmación.

## Búsqueda

Escribe en el campo de búsqueda de la barra superior. Los nodos que no coinciden se atenúan visualmente.

## Abrir archivos Markdown

Pulsa **Abrir .md** en la barra superior. Si ya hay un archivo abierto, el botón muestra **Cambiar archivo...**.

El archivo queda vinculado: al pulsar **Guardar** se escribe directamente en el mismo archivo sin mostrar el selector de nuevo.

## Guardar

Pulsa **Guardar** en la barra superior. Si hay un archivo abierto, se guarda directamente. Si no, se muestra el selector para elegir ubicación.

El autoguardado también guarda cambios tras unos segundos de inactividad, solo si hay un archivo abierto.

## Atajos de teclado

| Acción | Atajo |
|--------|-------|
| Guardar | `Ctrl + S` / `Cmd + S` |
| Copiar | `Ctrl + C` / `Cmd + C` |
| Pegar | `Ctrl + V` / `Cmd + V` |
| Borrar nodo seleccionado | `Delete` |
| Aceptar edición | `Ctrl + Enter` / `Cmd + Enter` |
| Cancelar edición | `Escape` |

## Formato Markdown

Los mapas se guardan como listas indentadas:

```markdown
- [ ] Idea central #central
  - [x] Rama completada #hecho
  - [ ] Rama pendiente #importante
    | Detalle adicional del nodo
  - Subrama sin etiquetas
```

Reglas:
- Cada línea que empieza con `-` crea un nodo.
- `[x]` o `[ ]` indican el estado desarrollado.
- La indentación (2 espacios) determina el nivel.
- Las etiquetas se escriben con `#`.
- Las líneas de continuación empiezan con `|`.

## Consejos

- Usa una sola idea central cuando el mapa sea pequeño.
- Usa varios nodos raíz cuando necesites separar temas.
- Usa `[x]`/`[ ]` para marcar progreso.
- Guarda el archivo con frecuencia si el navegador no permite acceso directo al sistema de archivos.
