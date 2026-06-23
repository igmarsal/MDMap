import { useEffect, useRef, useCallback } from 'react'

export function useAutoSave(
  getMd: () => string,
  save: (allowPicker: boolean) => Promise<void>,
  delay = 1000,
  isEnabled: () => boolean = () => true,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getMdRef = useRef(getMd)
  const saveRef = useRef(save)
  const enabledRef = useRef(isEnabled)

  getMdRef.current = getMd
  saveRef.current = save
  enabledRef.current = isEnabled

  const scheduleSave = useCallback(() => {
    // El autoguardado solo puede sobrescribir el archivo de origen cuando hay
    // un FileHandle real (File System Access API). En navegadores sin esa API
    // (Firefox/Safari) o cuando el archivo se abrió por el fallback, guardar
    // significa descargar un archivo nuevo, lo cual no es "autoguardado".
    // Si no está habilitado, no programamos nada para evitar una falsa
    // sensación de que se está persistiendo (pérdida silenciosa de datos).
    if (!enabledRef.current()) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      saveRef.current(false)
    }, delay)
  }, [delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { scheduleSave }
}
