import { useState, useCallback } from 'react'

interface ExportOptions {
  format: 'png'
  scope: 'current' | 'full' | 'selection'
  background: 'white' | 'transparent'
}

export function useMapExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPng = useCallback(async (
    container: HTMLElement,
    options: ExportOptions = { format: 'png', scope: 'current', background: 'white' }
  ): Promise<Blob | null> => {
    setIsExporting(true)

    try {
      // Importar html-to-image dinámicamente para no aumentar bundle si no se usa
      const { toPng } = await import('html-to-image')

      // Guardar viewport actual si es necesario
      const reactFlowViewport = container.querySelector('.react-flow__viewport') as HTMLElement
      const originalTransform = reactFlowViewport?.style.transform || ''

      // Ajustar según el scope
      if (options.scope === 'full') {
        // Calcular bounding box de todos los nodos
        const nodes = container.querySelectorAll('.react-flow__node')
        if (nodes.length > 0) {
          const bbox = Array.from(nodes).reduce((acc, node) => {
            const rect = node.getBoundingClientRect()
            return {
              left: Math.min(acc.left, rect.left),
              top: Math.min(acc.top, rect.top),
              right: Math.max(acc.right, rect.right),
              bottom: Math.max(acc.bottom, rect.bottom),
            }
          }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })

          // Ajustar viewport para incluir todo
          if (reactFlowViewport) {
            const centerX = (bbox.left + bbox.right) / 2
            const centerY = (bbox.top + bbox.bottom) / 2
            reactFlowViewport.style.transform = `translate(${centerX}px, ${centerY}px)`
          }
        }
      }

      // Generar imagen
      const dataUrl = await toPng(container, {
        backgroundColor: options.background === 'transparent' ? 'transparent' : '#ffffff',
        style: {
          margin: '0',
          padding: '0',
          transform: 'none',
        },
        quality: 1,
        pixelRatio: 2,
      })

      // Convertir a Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Restaurar viewport original
      if (reactFlowViewport && originalTransform) {
        reactFlowViewport.style.transform = originalTransform
      }

      return blob
    } catch (error) {
      console.error('Error al exportar PNG:', error)
      return null
    } finally {
      setIsExporting(false)
    }
  }, [])

  const downloadExportedFile = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const exportAndDownload = useCallback(async (
    container: HTMLElement,
    options: ExportOptions,
    filename: string
  ) => {
    const blob = await exportToPng(container, options)
    if (blob) {
      downloadExportedFile(blob, filename)
      return true
    }
    return false
  }, [exportToPng, downloadExportedFile])

  return {
    exportToPng,
    exportAndDownload,
    isExporting,
  }
}