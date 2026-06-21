# Plan: App de mapas mentales local-first + architecture.md

## Objetivo
Generar la estructura de carpetas de la app y un `architecture.md` basado en `specification.md`.

## Stack
- **Frontend:** Vite + React + TypeScript
- **UI:** Tailwind CSS + Shadcn/ui
- **Diagramas:** React Flow
- **Almacenamiento:** Solo archivos `.md` locales (File System Access API — Opción B del spec)

## Ruta de guardado del `.md`
El usuario elige la carpeta destino mediante `showOpenFilePicker` / `showDirectoryPicker`. Si usa `showDirectoryPicker`, la app lee y guarda directamente en ese directorio. Nombre por defecto sugerido: `mental_plan.md`.

## Estructura de carpetas
```
src/
├── components/
│   ├── ui/                    # Shadcn/ui base
│   ├── mindmap/
│   │   ├── MindMapCanvas.tsx
│   │   ├── NodeComponents.tsx
│   │   ├── EdgeComponents.tsx
│   │   └── Controls.tsx
│   └── MarkdownEditor/
│       ├── MarkdownEditor.tsx # Inline en nodo activo
│       └── PreviewPanel.tsx   # Vista previa del MD original
├── lib/
│   ├── parser/mdToNodes.ts    # MD → nodos React Flow (layout simple)
│   ├── compiler/nodesToMd.ts  # Nodos/edges → string MD
│   ├── fileSystem/useFileSystem.ts
│   └── utils/treeLayout.ts
├── stores/useMindMapStore.ts
└── hooks/useAutoSave.ts, useKeyboardShortcuts.ts
```
Raíz: `architecture.md`.

## Flujo de datos
`Archivo .md` → (parse) → `Nodos/Edges React Flow`
`Usuario edita nodo` → (compile) → `MD actualizado` → (save) → `Archivo .md`

## Tareas secuenciales
1. Inicializar Vite + React + TS + Tailwind + Shadcn/ui + React Flow
2. Crear estructura de carpetas
3. Implementar `mdToNodes` (`lib/parser/`)
4. Implementar `nodesToMd` (`lib/compiler/`)
5. Implementar `useFileSystem` con File System Access API (`lib/fileSystem/`)
6. Implementar `useMindMapStore` (estado global nodos/edges)
7. Construir `MindMapCanvas` con layout inicial y controles
8. Integrar auto-save con debounce
9. Generar `architecture.md` en raíz

## Validación y riesgos
- **Permisos:** File System Access API requiere HTTPS o localhost. Manejar denegación/pérdida de handle.
- **Parseo:** Validar indentación y jerarquía de listas MD.
- **Performance:** Debounce en auto-save para evitar escrituras frecuentes.
