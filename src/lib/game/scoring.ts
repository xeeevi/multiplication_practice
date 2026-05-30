import type { Mode } from '../../types'
import { MODE_MULTIPLIER } from './constants'

/** Score multiplier for the given mode. */
export function getMultiplier(mode: Mode): number {
  return MODE_MULTIPLIER[mode]
}

/**
 * Points awarded for a correct answer.
 * Base 10 + streak bonus (+2 per consecutive correct, capped at streak 10).
 * All multiplied by the mode multiplier.
 */
export function calcPoints(streak: number, mode: Mode): number {
  const base = 10
  const streakBonus = Math.min(streak, 10) * 2
  return Math.round((base + streakBonus) * getMultiplier(mode))
}

/** Results-screen title key based on accuracy (correct / total). */
export function getResultsTitleKey(correct: number, total: number): string {
  const pct = total === 0 ? 0 : correct / total
  if (pct >= 0.95) return 'title_increible'
  if (pct >= 0.80) return 'title_molt_be'
  if (pct >= 0.60) return 'title_bona_feina'
  if (pct <  0.40) return 'title_continua'
  return 'title_ben_fet'
}
