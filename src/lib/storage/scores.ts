import type { Mode, ScoreEntry } from '../../types'
import { STORAGE_KEYS } from '../game/constants'

const MAX_SCORES = 50

export function getScores(storageKey: string = STORAGE_KEYS.scores): ScoreEntry[] {
  try {
    return (JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? []) as ScoreEntry[]
  } catch {
    return []
  }
}

/**
 * Persist a new score entry.
 * @returns true if this is the all-time high score (for any non-zero score).
 */
export function saveScore(
  name: string,
  score: number,
  correct: number,
  wrong: number,
  bestStreak: number,
  tables: number[],
  mode: Mode,
  storageKey: string = STORAGE_KEYS.scores,
): boolean {
  const entry: ScoreEntry = {
    name,
    score,
    correct,
    wrong,
    bestStreak,
    tables: [...tables].sort((a, b) => a - b),
    mode,
    date: new Date().toISOString(),
  }
  const scores = getScores(storageKey)
  const isRecord =
    score > 0 && (scores.length === 0 || score > Math.max(...scores.map((s) => s.score)))
  scores.push(entry)
  scores.sort((a, b) => b.score - a.score)
  localStorage.setItem(storageKey, JSON.stringify(scores.slice(0, MAX_SCORES)))
  return isRecord
}

export function clearScores(storageKey: string = STORAGE_KEYS.scores): void {
  localStorage.removeItem(storageKey)
}

export function filterScores(scores: ScoreEntry[], mode: Mode | 'all'): ScoreEntry[] {
  return mode === 'all' ? scores : scores.filter((s) => s.mode === mode)
}
