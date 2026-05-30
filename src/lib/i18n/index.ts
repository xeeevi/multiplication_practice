import type { Lang } from '../../types'
import type { Translations } from './types'
import ca from './ca'
import es from './es'
import en from './en'

export type { Translations }
export type { Translations as TranslationsType }

export type TranslationKey = keyof Translations

const TRANSLATIONS: Record<Lang, Translations> = { ca, es, en }

export function getTranslations(lang: Lang): Translations {
  return TRANSLATIONS[lang]
}

/** Look up any key in the given language. */
export function t<K extends TranslationKey>(lang: Lang, key: K): Translations[K] {
  return TRANSLATIONS[lang][key]
}
