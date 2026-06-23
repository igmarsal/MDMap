# Changelog

## v0.1.0 (2026-06-23)

### Nuevo

- **Título y cuerpo separados en nodos**: el texto del nodo se divide en título (primera línea) y cuerpo (resto). Por defecto solo se ve el título. Al hacer clic en el nodo se despliega el cuerpo. Doble clic para editar ambos campos por separado. El formato Markdown usa `- Título` y `| cuerpo` para las líneas de continuación, manteniendo compatibilidad con versiones anteriores.

### Cambiado

- **Editor de nodos**: ahora muestra dos campos — "Título del nodo" (input) y "Cuerpo del nodo" (textarea multilínea), más etiquetas y checkbox "Desarrollado".
- **Vista de nodos**: el título se muestra en negrita (`font-semibold`). El cuerpo solo se muestra durante la edición (doble clic), no al hacer clic en el nodo, para evitar que el toggle del cuerpo se propague a otros elementos al seleccionar.

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
