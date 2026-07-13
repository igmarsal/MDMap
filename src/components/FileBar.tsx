import { Button } from './ui/Button'
import { useI18n } from '../lib/i18n'

const APP_NAME = 'MDMap'
const APP_VERSION = '0.7.1' // debe coincidir con la última versión del changelog

interface FileBarProps {
  fileName: string | null
  onOpenFile: () => void
  onSave: () => void
}

export default function FileBar({ fileName, onOpenFile, onSave }: FileBarProps) {
  const { t, lang, setLang } = useI18n()
  const fileOpen = !!fileName

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2 gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-semibold text-sm text-foreground whitespace-nowrap">
          {APP_NAME}
          <span className="ml-1 font-mono text-xs text-muted-foreground">v{APP_VERSION}</span>
        </span>
        <span className="text-muted-foreground/30 select-none">|</span>
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap truncate">
          {fileOpen ? (
            <>
              <span className="text-primary font-semibold mr-1">●</span>
              {fileName}
            </>
          ) : t('noFileOpen')}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-0.5 border border-border rounded-md overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setLang('es')}
            className={`px-1.5 py-0.5 transition-colors ${lang === 'es' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
          >
            {t('langEs')}
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-1.5 py-0.5 transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
          >
            {t('langEn')}
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenFile}>
          {fileOpen ? t('changeFile') : t('openFile')}
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          {t('save')}
        </Button>
      </div>
    </header>
  )
}
