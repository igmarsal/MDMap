# Architecture

## Overview
Local-first mind map tool. No backend, no cloud. The only persistence layer is a Markdown file selected by the user via the File System Access API (with a degraded fallback for browsers that do not support it).

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4 (with `@tailwindcss/vite`)
- React Flow
- File System Access API (`showOpenFilePicker`, `showSaveFilePicker`) with a `<input type="file">` fallback
- UI components: lightweight custom components inspired by shadcn/ui patterns (shadcn/ui is **not** a dependency)

## Modules

### `mdToNodes` (`lib/parser/mdToNodes.ts`)
Parses a Markdown file (list indentation) into the node/edge structure used by React Flow. Calculates X/Y positions using a simple tree layout.

### `nodesToMd` (`lib/compiler/nodesToMd.ts`)
Traverses the React Flow node/edge tree and emits a Markdown string with correct indentation. Serializes every node as a checkbox item (`- [ ]` / `- [x]`); empty titles are preserved (not injected) so the round-trip `open → save → open` is idempotent.

### `useFileSystem` (`lib/fileSystem/useFileSystem.ts`)
Hook wrapping the File System Access API (`showOpenFilePicker`, `showSaveFilePicker`). Handles read/write and file handle lifecycle. Includes a `fallbackOpen` path (based on `<input type="file">`) for browsers without the API; the fallback rejects with `AbortError` if the user cancels the picker so the UI does not hang.

### State management
The real application state lives in **`App.tsx`** as React Flow local state (`nodes`, `edges`, `selectedNodeIds`, `editingNodeId`, `fileName`, etc.), mirrored into refs to avoid stale closures in async handlers. This is the single source of truth for the canvas.

> Note: `src/stores/useMindMapStore.tsx` exists as an unused placeholder/seed and is **not** wired into the app (no `MindMapProvider` is rendered). Do not rely on it for state.

### `useAutoSave` (`hooks/useAutoSave.ts`)
Schedules a deferred write. It only fires when an overwrite target exists (a real `FileSystemFileHandle`); on browsers without the File System Access API, or when the file was opened via the fallback, autosave is a no-op and the user must save manually (which downloads a new file).

### `useKeyboardShortcuts` (`hooks/useKeyboardShortcuts.ts`)
Global keyboard handler for save/delete/copy/paste and `Tab`/`Shift+Tab` (add child/sibling, wired from `App.tsx`). Undo/redo (`Ctrl+Z`/`Ctrl+Y`) is registered as a placeholder and not yet wired.

## Data flow

```
.md file  --(parse)-->  React Flow nodes/edges
User edit --(compile)--> Updated .md --(save)--> .md file
```

## Browser support
- **Chromium-based** (Chrome, Edge, Brave): full support — open and overwrite the same `.md` in place, plus deferred autosave.
- **Other browsers** (Firefox, Safari): opening uses a file picker fallback; saving always downloads a new file (no in-place overwrite); autosave is disabled.

## Local behavior
- Runs entirely in the browser. No outbound network requests.
- The user chooses where the `.md` lives via the native file picker.
- Theme (light/dark) follows the system preference (`prefers-color-scheme`); node background, foreground and selection use CSS theme tokens.
