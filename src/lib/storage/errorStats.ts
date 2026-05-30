import type { AllErrorStats, UserStats } from '../../types'
import { STORAGE_KEYS } from '../game/constants'

/** Normalise a player name to a stable storage key. */
export function getUserKey(name: string): string {
  const trimmed = name.trim().toLowerCase()
  return trimmed || '_default'
}

/**
 * Read the full error-stats object from localStorage.
 * Performs a one-time migration from the old flat format
 * ({ "7x8": {attempts,errors} }) to the per-user nested format.
 */
export function getAllErrorStats(storageKey: string = STORAGE_KEYS.errors): AllErrorStats {
  let raw: AllErrorStats
  try {
    raw = (JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? {}) as AllErrorStats
  } catch {
    raw = {}
  }

  // Migration: old flat format had "AxB" keys at the top level (mult only)
  if (storageKey === STORAGE_KEYS.errors) {
    const keys = Object.keys(raw)
    const isLegacy = keys.length > 0 && keys.every((k) => /^\d+x\d+$/.test(k))
    if (isLegacy) {
      raw = { _default: raw as unknown as UserStats }
      localStorage.setItem(storageKey, JSON.stringify(raw))
    }
  }

  return raw
}

/** Per-user stats for the given player name. */
export function getErrorStats(name: string, storageKey: string = STORAGE_KEYS.errors): UserStats {
  return getAllErrorStats(storageKey)[getUserKey(name)] ?? {}
}

/** Record a single attempt outcome for one problem. */
export function saveErrorStat(
  name: string,
  key: string,
  wasCorrect: boolean,
  storageKey: string = STORAGE_KEYS.errors,
): void {
  const all = getAllErrorStats(storageKey)
  const uk = getUserKey(name)
  if (!all[uk]) all[uk] = {}
  const entry = all[uk][key] ?? { attempts: 0, errors: 0 }
  entry.attempts++
  if (!wasCorrect) entry.errors++
  all[uk][key] = entry
  localStorage.setItem(storageKey, JSON.stringify(all))
}

/**
 * Return multiplication pairs the user struggles with:
 * at least 3 attempts with an error rate above 40 %.
 */
export function getWeakProblems(name: string, storageKey: string = STORAGE_KEYS.errors): Array<{ a: number; b: number }> {
  const stats = getErrorStats(name, storageKey)
  const weak: Array<{ a: number; b: number }> = []
  for (const [key, val] of Object.entries(stats)) {
    if (val.attempts >= 3 && val.errors / val.attempts > 0.4) {
      const [a, b] = key.split('x').map(Number)
      weak.push({ a: a!, b: b! })
    }
  }
  return weak
}
