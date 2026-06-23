# MDMap v0.1.0

MDMap es una aplicación web para crear mapas mentales en formato Markdown. Permite editar nodos visualmente, organizar ideas en ramas, abrir y guardar archivos `.md`, y usar etiquetas para clasificar conceptos.

## Tecnologías

- React 19 + TypeScript
- Vite + React Flow
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

## Compilación para producción

```bash
# Build estándar (genera dist/)
npm run build

# Script completo: build + copia a release/ + genera ZIP
node scripts/compilar-aplicacion.mjs
```

El script genera `release/MDMap_v0.1.0.zip` con el servidor standalone incluido.

## Ejecutar versión compilada

```bash
# Con el servidor standalone (sin dependencias)
cd release/MDMap
node server.mjs

# O con Vite preview
npm run preview

# O simplemente abrir dist/index.html en el navegador
```

## Scripts multiplataforma

| Sistema | Archivo |
|---------|---------|
| Windows | `scripts/compilar-aplicacion.bat` |
| macOS | `scripts/compilar-aplicacion.command` |
| Linux | `scripts/compilar-aplicacion.sh` |

## Uso rápido

1. Abre la aplicación.
2. Haz doble clic en un nodo para editarlo.
3. Escribe el texto y pulsa `Ctrl + Enter` / `Cmd + Enter` para aceptar.
4. Añade nodos con los botones de la barra superior o desde el nodo seleccionado.
5. Guarda el mapa como Markdown con el botón **Guardar**.
6. Usa `Ctrl+C`/`Ctrl+V` para copiar y pegar nodos.
7. `Shift+Click` para selección múltiple.

## Características

- **Título y cuerpo separados**: el título se muestra siempre en negrita; el cuerpo se despliega al hacer clic en el nodo.
- **Nodos desarrollados**: marca `[x]`/`[ ]` en el editor. El padre se marca automáticamente si todos sus hijos lo están.
- **Búsqueda**: filtra nodos por texto o etiqueta desde la barra superior.
- **Minimapa**: auto-ocultable en la esquina inferior izquierda.
- **Formato Markdown**: los mapas se guardan como listas indentadas (`-`), con soporte para etiquetas (`#tag`) y líneas de continuación (`|`).

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

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `server.mjs` | Servidor HTTP standalone (sin dependencias) |
| `scripts/compilar-aplicacion.mjs` | Script de build + release |
| `docs/changelog.md` | Historial de versiones |
| `docs/manual_usuario.md` | Manual de usuario |
| `docs/manual_administrador.md` | Manual de administrador |

## Formato Markdown

```markdown
- [ ] Idea central #central
  | Cuerpo opcional de la idea central
  - [x] Rama completada #hecho
    | Detalle del cuerpo
  - [ ] Rama pendiente #importante
```

## Changelog

Ver [docs/changelog.md](docs/changelog.md).
