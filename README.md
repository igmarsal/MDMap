# MDMap

MDMap es una aplicación web para crear mapas mentales en formato Markdown. Permite editar nodos visualmente, organizar ideas en ramas, abrir y guardar archivos `.md`, y usar etiquetas para clasificar conceptos.

## Tecnologías

- React 19
- TypeScript
- Vite
- React Flow
- Tailwind CSS v4

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

## Compilación

```bash
npm run build
```

Los archivos generados se publican en la carpeta `dist`.

## Vista previa de la aplicación compilada

```bash
npm run preview
```

## Uso rápido

1. Abre la aplicación.
2. Haz doble clic en un nodo para editarlo.
3. Escribe el texto y pulsa `Ctrl + Enter` o `Cmd + Enter` para aceptar.
4. Añade nodos con los botones de la barra superior o desde el nodo seleccionado.
5. Guarda el mapa como Markdown con el botón **Guardar**.

## Estructura principal

```text
src/
  App.tsx                         Estado principal y acciones del mapa
  components/
    FileBar.tsx                   Barra de apertura y guardado
    MarkdownEditor/               Editor y vista previa de Markdown
    mindmap/                      Lienzo, nodos, bordes y toolbar
  hooks/                          Atajos de teclado y autoguardado
  lib/
    compiler/                     Conversión de nodos a Markdown
    fileSystem/                   Apertura y guardado de archivos
    parser/                       Conversión de Markdown a nodos
  stores/                         Contexto de mapa mental
```

## Archivos Markdown

Los mapas se guardan como listas Markdown indentadas:

```markdown
- Idea central
  - Rama 1
  - Rama 2
```

También puedes usar etiquetas:

```markdown
- Idea central #central
  - Tarea importante #importante
```

Las líneas de continuación se escriben con `|`:

```markdown
- Idea central
  | Detalle adicional del nodo
  - Rama 1
```

## Script de compilación multiplataforma

En `scripts/` hay ejecutables para compilar la aplicación y abrirla en el navegador:

- Windows: `scripts/compilar-aplicacion.bat`
- macOS: `scripts/compilar-aplicacion.command`
- Linux: `scripts/compilar-aplicacion.sh`

El script ejecuta `npm run build`, genera un ZIP portable en `release/`, inicia la vista previa en `http://127.0.0.1:4173` y abre esa URL en el navegador predeterminado.
