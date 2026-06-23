# Manual de administrador de MDMap v0.0.1

## Visión general

MDMap es una aplicación frontend construida con React, TypeScript, Vite, React Flow y Tailwind CSS. No requiere servidor backend. La persistencia se realiza mediante archivos Markdown abiertos desde el navegador.

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
  App.tsx                         Estado principal del mapa
  components/
    FileBar.tsx                   Barra de apertura y guardado
    MarkdownEditor/               Editor y vista previa Markdown
    mindmap/                      Lienzo, nodos, bordes y toolbar
      MindMapCanvas.tsx           Lienzo React Flow con auto-ocultación
      NodeComponent.tsx           Nodo personalizado con editor y checkbox
      Toolbar.tsx                 Barra de herramientas flotante
      EdgeComponent.tsx           Arista personalizada
      NodeCallbacksContext.tsx     Contexto de callbacks de nodo
  hooks/
    useKeyboardShortcuts.ts       Atajos de teclado
    useAutoSave.ts                Autoguardado diferido
  lib/
    compiler/nodesToMd.ts         Nodos → Markdown
    fileSystem/useFileSystem.ts   Apertura/guardado de archivos
    parser/mdToNodes.ts           Markdown → nodos
  stores/useMindMapStore.tsx      Contexto de estado
  main.tsx                        Punto de entrada
  index.css                       Estilos y tema Tailwind
```

## Archivos críticos

### `src/App.tsx`

Coordina el estado del mapa, nodos, conexiones, archivo activo, copiar/pegar, añadir/eliminar nodos, y conversión entre nodos y Markdown.

### `src/lib/parser/mdToNodes.ts`

Convierte Markdown indentado en nodos. Funciones: `parseIndentation`, `parseTags`, `mdToNodes`, `calculateLayout`. Soporta `[x]`/`[ ]` para estado desarrollado.

### `src/lib/compiler/nodesToMd.ts`

Convierte nodos en Markdown. Funciones: `formatNodeText`, `nodesToMd`. Serializa `[x]`/`[ ]`.

### `src/lib/fileSystem/useFileSystem.ts`

Gestiona apertura y guardado de archivos. Usa `showOpenFilePicker`/`showSaveFilePicker` (File System Access API). Incluye `fallbackOpen` para navegadores no compatibles.

## Criterios de aceptación para nuevas versiones

1. `npm run build` sin errores.
2. Abrir la aplicación en Chrome y Firefox.
3. Crear un mapa con nodos, etiquetas y ramas.
4. Marcar/desmarcar estado desarrollado en varios nodos.
5. Verificar que el padre se actualiza automáticamente.
6. Guardar el `.md` y recargar la aplicación.
7. Abrir el `.md` guardado y confirmar que el mapa se reconstruye.
8. Probar copiar/pegar con selección simple y múltiple.
9. Probar borrar con y sin confirmación.
10. Usar el buscador y verificar el atenuado de nodos.
11. Ejecutar `node scripts/compilar-aplicacion.mjs` y verificar el ZIP.

## Despliegue estático

La aplicación es completamente estática. Publicar el contenido de `dist/` (o `release/MDMap/` sin `server.mjs`) en cualquier servidor web.

## Limitaciones conocidas

- El acceso directo a archivos requiere navegadores con File System Access API.
- En navegadores no compatibles, el guardado usa descarga (crea un archivo nuevo cada vez).
- No existe autenticación ni sincronización en la nube.
- `Tab` para añadir sibling/child no está implementado.

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
