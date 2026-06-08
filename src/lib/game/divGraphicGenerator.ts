import type { Question, UserStats } from '../../types'
import { TOTAL_QUESTIONS, MAX_REPEAT, MIN_GAP } from './constants'
import { calcWeight } from './questionGenerator'

/**
 * Build the candidate pool for the interactive drag game (Level 1).
 *
 * Strategy: enumerate (divisor n ∈ [2,10]) × (dividend d ∈ [10,99]).
 *
 *   Hard filters
 *   ─────────────────────────────────────────────────────────────────────────
 *   • Q = ⌊d/n⌋ < 2      → trivial quotient; skip.
 *   • T = ⌊d/10⌋ > 6     → too many bars on screen; skip.
 *   • barsToBreak > 1     → would require breaking 2+ bars; skip.
 *
 *   barsToBreak:
 *     Q ≥ 10 → T % n   (bars that don't distribute evenly, need breaking)
 *     Q < 10 → T        (all bars must be broken since a bar = 10 > quotient)
 *
 *   This automatically caps loose-cross count at ≤ 19, keeping dragging sane.
 *
 *   Weights
 *   ─────────────────────────────────────────────────────────────────────────
 *   Base: adaptive error-history weight from calcWeight().
 *   • barsToBreak === 0 → ×1.5  (no breaking needed — preferred)
 *   • barsToBreak === 1 → ×0.6  (one break needed — less common)
 *   • Q ≥ 10 && Q%10 ≥ 1 → ×1.4  (bags get both bars AND crosses — ideal)
 *   • Q ≥ 10 && Q%10 === 0 → ×0.2  (bags get only bars — down-weighted)
 *   • n ≤ 5 → ×1.0, n > 5 → ×0.6  (gently favour smaller, richer problems)
 */
export function buildDivPool(userStats: UserStats): Question[] {
  const pool: Question[] = []

  for (let n = 2; n <= 10; n++) {
    for (let d = 10; d <= 99; d++) {
      const Q = Math.floor(d / n)
      const R = d % n
      const T = Math.floor(d / 10)

      if (Q < 2) continue
      if (T > 6) continue

      const barsToBreak = Q >= 10 ? T % n : T
      if (barsToBreak > 1) continue

      const key = `${d}÷${n}`
      const base = calcWeight(userStats, key)
      const noBreakBoost    = barsToBreak === 0 ? 1.5 : 0.6
      const bothBoost       = (Q >= 10 && Q % 10 >= 1)  ? 1.4 : 1
      const onlyBarsPenalty = (Q >= 10 && Q % 10 === 0) ? 0.2 : 1
      const smallDivBoost   = n <= 5 ? 1 : 0.6

      pool.push({
        a: d,
        b: n,
        answer: Q,
        remainder: R,
        key,
        weight: base * noBreakBoost * bothBoost * onlyBarsPenalty * smallDivBoost,
        operation: '÷',
      })
    }
  }

  return pool
}

/**
 * Generate a 20-question list for the interactive graphical division game.
 * Uses the same adaptive weighting and cap/gap rules as other generators.
 */
export function generateDivGraphic(
  userStats: UserStats,
  rng: () => number = Math.random,
): Question[] {
  const pool = buildDivPool(userStats)

  function weightedPick(candidates: Question[]): Question {
    const total = candidates.reduce((sum, c) => sum + c.weight, 0)
    let r = rng() * total
    for (const c of candidates) {
      r -= c.weight
      if (r <= 0) return c
    }
    return candidates[candidates.length - 1]!
  }

  const questions: Question[] = []
  const counts: Record<string, number> = {}
  const lastPos: Record<string, number> = {}

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    let candidates = pool.filter((p) => {
      if ((counts[p.key] ?? 0) >= MAX_REPEAT) return false
      const lp = lastPos[p.key]
      if (lp !== undefined && i - lp <= MIN_GAP) return false
      return true
    })

    if (candidates.length === 0) {
      const prev = questions[i - 1]
      candidates = pool.filter(
        (p) => (counts[p.key] ?? 0) < MAX_REPEAT && p.key !== prev?.key,
      )
    }

    if (candidates.length === 0) {
      const prev = questions[i - 1]
      candidates = pool.filter((p) => p.key !== prev?.key)
    }

    if (candidates.length === 0) candidates = pool

    const picked = weightedPick(candidates)
    questions.push(picked)
    counts[picked.key] = (counts[picked.key] ?? 0) + 1
    lastPos[picked.key] = i
  }

  return questions
}
