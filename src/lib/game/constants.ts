import type { Mode } from '../../types'

export const TOTAL_QUESTIONS = 20
export const MAX_REPEAT = 4   // max times a single fact appears per round
export const MIN_GAP = 2      // min other questions between repeats of the same fact

export const STORAGE_KEYS = {
  scores:     'mult_practice_scores',
  errors:     'mult_practice_errors',
  playerName: 'mult_player_name',
  lang:       'mult_lang',
  opsScores:  'ops_practice_scores',
  opsErrors:  'ops_practice_errors',
} as const

/** Seconds allowed per question for each timed mode (null = unlimited). */
export const MODE_SECONDS: Record<Mode, number | null> = {
  free: null,
  '5':   5,
  '10': 10,
  '20': 20,
}

/** Score multiplier for each mode. */
export const MODE_MULTIPLIER: Record<Mode, number> = {
  free: 1,
  '5':   3,
  '10':  2,
  '20':  1.5,
}
