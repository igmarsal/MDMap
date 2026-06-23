import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export type Lang = 'es' | 'en'

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const translations: Record<Lang, Record<string, string>> = {
  es: {
    // FileBar
    noFileOpen: 'Sin archivo abierto',
    searchPlaceholder: 'Buscar nodos...',
    body: 'Cuerpo',
    openFile: 'Abrir .md',
    changeFile: 'Cambiar archivo...',
    save: 'Guardar',
    unsaved: 'Sin guardar...',

    // Toolbar
    addRoot: '+ Raíz',
    addChild: '+ Hijo',
    copy: 'Copiar',
    delete: '✕ Borrar',
    paste: 'Pegar',

    // NodeComponent
    nodeTitlePlaceholder: 'Título del nodo...',
    nodeBodyPlaceholder: 'Cuerpo del nodo (opcional)...',
    nodeTagsPlaceholder: 'etiquetas separadas por coma (central, importante, idea...)',
    developed: 'Desarrollado',
    cancelAction: 'Cancelar',
    acceptAction: 'Aceptar',

    // App
    newRoot: 'Nuevo nodo raíz',
    newNode: 'Nuevo nodo',
    unsavedChangesConfirm: 'Hay cambios sin guardar. ¿Deseas abrir otro archivo?',
    deleteConfirm: 'Se eliminará {count} nodo. ¿Continuar?|Se eliminarán {count} nodos. ¿Continuar?',
    initialMd: '- Idea central\n  - Rama 1\n  - Rama 2\n',
    suggestFileName: 'mdmap_plan.md',

    // useFileSystem
    permissionDenied: 'Permiso de escritura denegado.',
    noFileSelected: 'No se seleccionó archivo',

    // i18n toggle
    langEs: 'ES',
    langEn: 'EN',
  },
  en: {
    // FileBar
    noFileOpen: 'No file open',
    searchPlaceholder: 'Search nodes...',
    body: 'Body',
    openFile: 'Open .md',
    changeFile: 'Change file...',
    save: 'Save',
    unsaved: 'Unsaved...',

    // Toolbar
    addRoot: '+ Root',
    addChild: '+ Child',
    copy: 'Copy',
    delete: '✕ Delete',
    paste: 'Paste',

    // NodeComponent
    nodeTitlePlaceholder: 'Node title...',
    nodeBodyPlaceholder: 'Node body (optional)...',
    nodeTagsPlaceholder: 'comma-separated tags (central, important, idea...)',
    developed: 'Developed',
    cancelAction: 'Cancel',
    acceptAction: 'Accept',

    // App
    newRoot: 'New root node',
    newNode: 'New node',
    unsavedChangesConfirm: 'You have unsaved changes. Open another file?',
    deleteConfirm: 'Delete {count} node?|Delete {count} nodes?',
    initialMd: '- Central idea\n  - Branch 1\n  - Branch 2\n',
    suggestFileName: 'mdmap_plan.md',

    // useFileSystem
    permissionDenied: 'Write permission denied.',
    noFileSelected: 'No file selected',

    // i18n toggle
    langEs: 'ES',
    langEn: 'EN',
  },
}

function pluralize(key: string, count: number, lang: Lang): string {
  const entry = translations[lang][key]
  if (!entry) return key
  // Support singular|plural syntax
  const variants = entry.split('|')
  if (variants.length === 1) return entry
  if (lang === 'es') return count === 1 ? variants[0] : variants[1]
  // English: singular if count === 1
  return count === 1 ? variants[0] : variants[1]
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val != null ? String(val) : `{${key}}`
  })
}

function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language?.toLowerCase() || ''
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

const STORAGE_KEY = 'mdmap_lang'

const I18nCtx = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'es' || stored === 'en') return stored
    } catch { /* noop */ }
    return detectBrowserLang()
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* noop */ }
  }, [])

  // Actualizar el atributo lang del <html> para accesibilidad/navegadores
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    // Handle plural keys ({count})
    if (vars?.count !== undefined && typeof vars.count === 'number') {
      const pluralized = pluralize(key, vars.count, lang)
      return interpolate(pluralized, { ...vars, count: vars.count })
    }
    const text = translations[lang][key]
    if (text === undefined) {
      // Fallback to Spanish, then to key
      return translations.es[key] ?? key
    }
    return interpolate(text, vars)
  }, [lang])

  return (
    <I18nCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nCtx.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nCtx)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
