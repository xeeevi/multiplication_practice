import type { Question, UserStats } from '../../types'
import { TOTAL_QUESTIONS, MAX_REPEAT, MIN_GAP } from './constants'

/**
 * Adaptive weight for a single multiplication pair.
 * - errorRate × confidence scales weight from 1 (fresh/perfect) to 3 (often wrong).
 * - confidence ramps up over 5 attempts to avoid over-boosting on sparse data.
 */
export function calcWeight(stats: UserStats, key: string): number {
  const s = stats[key] ?? { attempts: 0, errors: 0 }
  if (s.attempts === 0) return 1
  const errorRate = s.errors / s.attempts
  const confidence = Math.min(s.attempts, 5) / 5
  return 1 + 2 * errorRate * confidence // [1, 3]
}

/**
 * Weighted-random pick from a list of candidates.
 * Injectable `rng` (default Math.random) makes tests deterministic.
 */
function weightedPick(candidates: Question[], rng: () => number): Question {
  const total = candidates.reduce((sum, c) => sum + c.weight, 0)
  let r = rng() * total
  for (const c of candidates) {
    r -= c.weight
    if (r <= 0) return c
  }
  return candidates[candidates.length - 1]
}

/**
 * Generate a 20-question list for the current round.
 *
 * Rules (in priority order):
 *  1. Each fact appears at most MAX_REPEAT (4) times.
 *  2. At least MIN_GAP (2) other questions between repeats of the same fact.
 *  3. Never two identical questions back-to-back.
 *  4. Facts are sampled by adaptive weight — weak facts appear more often.
 *
 * If strict rules can't be satisfied (very small pool), they are relaxed
 * gracefully: spacing first, then only the no-immediate-repeat rule remains.
 *
 * @param selectedTables - Array of table numbers the user selected (e.g. [3,7,9]).
 * @param userStats      - Per-user error stats used for weighting.
 * @param rng            - Random number generator (injectable for testing).
 */
export function generate(
  selectedTables: number[],
  userStats: UserStats,
  rng: () => number = Math.random,
): Question[] {
  // Build the full candidate pool with weights
  const pool: Question[] = []
  for (const a of selectedTables) {
    for (let b = 1; b <= 10; b++) {
      const key = `${a}x${b}`
      pool.push({ a, b, answer: a * b, key, weight: calcWeight(userStats, key), operation: '×' })
    }
  }

  const questions: Question[] = []
  const counts: Record<string, number> = {}
  const lastPos: Record<string, number> = {}

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    // Filter 1: full constraints — cap + spacing
    let candidates = pool.filter((p) => {
      if ((counts[p.key] ?? 0) >= MAX_REPEAT) return false
      const lp = lastPos[p.key]
      if (lp !== undefined && i - lp <= MIN_GAP) return false
      return true
    })

    // Filter 2: relax spacing (keep cap + no-immediate-repeat)
    if (candidates.length === 0) {
      const prev = questions[i - 1]
      candidates = pool.filter(
        (p) => (counts[p.key] ?? 0) < MAX_REPEAT && p.key !== prev?.key,
      )
    }

    // Filter 3: only no-immediate-repeat
    if (candidates.length === 0) {
      const prev = questions[i - 1]
      candidates = pool.filter((p) => p.key !== prev?.key)
    }

    // Absolute fallback: full pool (theoretically unreachable with ≥10 pairs + cap 4)
    if (candidates.length === 0) {
      candidates = pool
    }

    const picked = weightedPick(candidates, rng)
    questions.push(picked)
    counts[picked.key] = (counts[picked.key] ?? 0) + 1
    lastPos[picked.key] = i
  }

  return questions
}
