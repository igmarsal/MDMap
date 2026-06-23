import { Button } from './ui/Button'
import { useI18n } from '@/lib/i18n'

interface FileBarProps {
  fileName: string | null
  searchQuery: string
  showBody: boolean
  onSearchChange: (query: string) => void
  onToggleShowBody: (value: boolean) => void
  onOpenFile: () => void
  onSave: () => void
}

export default function FileBar({ fileName, searchQuery, showBody, onSearchChange, onToggleShowBody, onOpenFile, onSave }: FileBarProps) {
  const { t, lang, setLang } = useI18n()
  const fileOpen = !!fileName

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2 gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {fileOpen ? (
            <>
              <span className="text-primary font-semibold mr-1">●</span>
              {fileName}
            </>
          ) : t('noFileOpen')}
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="ml-4 bg-background border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary w-48"
        />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none whitespace-nowrap ml-2">
          <input
            type="checkbox"
            checked={showBody}
            onChange={(e) => onToggleShowBody(e.target.checked)}
            className="accent-primary"
          />
          {t('body')}
        </label>
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
