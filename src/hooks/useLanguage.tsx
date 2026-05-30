import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Lang } from '../types'
import { loadLanguage, saveLanguage } from '../lib/storage/language'
import { getTranslations } from '../lib/i18n'
import type { Translations } from '../lib/i18n'

interface LanguageContextValue {
  lang: Lang
  tr: Translations
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLanguage())

  const setLang = useCallback((next: Lang) => {
    saveLanguage(next)
    document.documentElement.lang = next
    setLangState(next)
  }, [])

  const tr = getTranslations(lang)

  return (
    <LanguageContext.Provider value={{ lang, tr, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
