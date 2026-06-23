import { useCallback } from 'react'

export type FileHandleState = {
  fileHandle: FileSystemFileHandle | null
  fileName: string
}

const hasSaveFS = typeof window !== 'undefined' && 'showSaveFilePicker' in window

async function ensureWrite(handle: FileSystemFileHandle) {
  const h = handle as any
  if (!h.queryPermission) return
  const perm = await h.queryPermission({ mode: 'readwrite' })
  if (perm === 'granted') return
  if (!h.requestPermission) return
  const result = await h.requestPermission({ mode: 'readwrite' })
  if (result !== 'granted') {
    throw new Error('Write permission denied.')
  }
}

export function useFileSystem() {
  const openFile = useCallback(async (): Promise<{ md: string; state: FileHandleState }> => {
    if (!hasSaveFS || !('showOpenFilePicker' in window)) return fallbackOpen()

    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      multiple: false,
    })
    await ensureWrite(handle)
    const file = await handle.getFile()
    return {
      md: await file.text(),
      state: { fileHandle: handle, fileName: handle.name },
    }
  }, [])

  const saveFile = useCallback(async (md: string, handle: FileSystemFileHandle): Promise<void> => {
    await ensureWrite(handle)
    const writable = await handle.createWritable()
    await writable.write(md)
    await writable.close()
  }, [])

  return { openFile, saveFile }
}

function fallbackOpen(): Promise<{ md: string; state: FileHandleState }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'

    let done = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    input.onchange = async () => {
      if (done) return
      done = true
      clearTimeout(timeoutId)
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      resolve({
        md: await file.text(),
        state: { fileHandle: null, fileName: file.name },
      })
    }

    // Si tras 30 segundos no se ha seleccionado nada, lo tratamos como
    // cancelación para que la UI no quede colgada. El AbortError es
    // manejado silenciosamente por handleOpenFile.
    timeoutId = setTimeout(() => {
      if (!done) {
        done = true
        reject(new DOMException('Operación cancelada', 'AbortError'))
      }
    }, 30_000)

    input.click()
  })
}
