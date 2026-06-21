import { useEffect, useRef, useCallback } from 'react'

export function useAutoSave(
  getMd: () => string,
  save: (allowPicker: boolean) => Promise<void>,
  delay = 1000,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getMdRef = useRef(getMd)
  const saveRef = useRef(save)

  getMdRef.current = getMd
  saveRef.current = save

  const scheduleSave = useCallback(() => {
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
