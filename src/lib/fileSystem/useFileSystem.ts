import { useCallback } from 'react'

export type FileHandleState = {
  fileHandle: FileSystemFileHandle | null
  directoryHandle: FileSystemDirectoryHandle | null
  fileName: string
}

const hasFS = typeof window !== 'undefined' && 'showOpenFilePicker' in window

function download(content: string, name: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function ensureWrite(handle: FileSystemFileHandle) {
  const h = handle as any
  if (!h.queryPermission) return
  const perm = await h.queryPermission({ mode: 'readwrite' })
  if (perm === 'granted') return
  if (!h.requestPermission) return
  const result = await h.requestPermission({ mode: 'readwrite' })
  if (result !== 'granted') {
    throw new Error('Permiso de escritura denegado.')
  }
}

export function useFileSystem() {
  const openFile = useCallback(async (): Promise<{ md: string; state: FileHandleState }> => {
    if (!hasFS) return fallbackOpen()

    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      multiple: false,
    })
    await ensureWrite(handle)
    const file = await handle.getFile()
    return {
      md: await file.text(),
      state: { fileHandle: handle, directoryHandle: null, fileName: handle.name },
    }
  }, [])

  const saveFile = useCallback(async (md: string, handle: FileSystemFileHandle): Promise<void> => {
    if (!hasFS) {
      download(md, 'mental_plan.md')
      return
    }
    await ensureWrite(handle)
    const writable = await handle.createWritable()
    await writable.write(md)
    await writable.close()
  }, [])

  const openDirectory = useCallback(async (): Promise<{ md: string; state: FileHandleState }> => {
    if (!hasFS) return fallbackOpen()

    const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
    const fileHandle = await dirHandle.getFileHandle('mental_plan.md', { create: true })
    await ensureWrite(fileHandle)
    const file = await fileHandle.getFile()
    let text = ''
    try { text = await file.text() } catch { text = '' }
    return {
      md: text || '- Idea central\n  - Rama 1\n  - Rama 2\n',
      state: { fileHandle, directoryHandle: dirHandle, fileName: 'mental_plan.md' },
    }
  }, [])

  return { openFile, saveFile, openDirectory }
}

function fallbackOpen(): Promise<{ md: string; state: FileHandleState }> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) throw new Error('No se seleccionó archivo')
      resolve({
        md: await file.text(),
        state: { fileHandle: null, directoryHandle: null, fileName: file.name },
      })
    }
    input.click()
  })
}
