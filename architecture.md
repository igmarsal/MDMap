# Architecture

## Overview
Local-first mind map tool. No backend, no cloud. The only persistence layer is a Markdown file selected by the user via the File System Access API.

## Stack
- Vite + React + TypeScript
- Tailwind CSS + Shadcn/ui
- React Flow
- File System Access API

## Modules

### `mdToNodes` (`lib/parser/mdToNodes.ts`)
Parses a Markdown file (list indentation) into the node/edge structure used by React Flow. Calculates X/Y positions using a simple tree layout.

### `nodesToMd` (`lib/compiler/nodesToMd.ts`)
Traverses the React Flow node/edge tree and emits a Markdown string with correct indentation.

### `useFileSystem` (`lib/fileSystem/useFileSystem.ts`)
Hook wrapping the File System Access API (`showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker`). Handles read/write and file handle lifecycle.

### `useMindMapStore` (`stores/useMindMapStore.ts`)
Global state for nodes and edges. Single source of truth for the canvas.

## Data flow

```
.md file  --(parse)-->  React Flow nodes/edges
User edit --(compile)--> Updated .md --(save)--> .md file
```

## Local behavior
- Runs entirely in the browser. No outbound network requests.
- The user chooses where the `.md` lives via the native file picker.
- Dark mode, minimalist UI by default.
