import type { Lang } from '../../types'
import { STORAGE_KEYS } from '../game/constants'

const VALID_LANGS: Lang[] = ['ca', 'es', 'en']

export function loadLanguage(): Lang {
  const stored = localStorage.getItem(STORAGE_KEYS.lang) as Lang | null
  return stored && VALID_LANGS.includes(stored) ? stored : 'ca'
}

export function saveLanguage(lang: Lang): void {
  localStorage.setItem(STORAGE_KEYS.lang, lang)
}
