import type { Lang } from '../types'
import { useLanguage } from '../hooks/useLanguage'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ca', label: '🇪🇸 CA' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'en', label: '🇬🇧 EN' },
]

export function LanguageBar() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex justify-end gap-2 px-4 pt-2.5">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={[
            'rounded-[10px] border-2 px-3 py-1 font-sans text-[0.82em] font-bold transition-all',
            'active:translate-y-0.5 active:border-b',
            lang === code
              ? 'border-school-blue border-b-[3px] border-b-school-blue-sh bg-school-blue text-white'
              : 'border-school-border border-b-[3px] border-b-[#c8bfb5] bg-school-card text-school-soft',
          ].join(' ')}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
