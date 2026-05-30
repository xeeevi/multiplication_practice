import type { Question, UserStats, Operation } from '../../types'
import { TOTAL_QUESTIONS, MAX_REPEAT, MIN_GAP } from './constants'
import { calcWeight } from './questionGenerator'

/** Build the candidate pool for all selected operations. */
function buildPool(ops: Operation[], userStats: UserStats): Question[] {
  const pool: Question[] = []

  for (const op of ops) {
    if (op === '×') {
      // All multiplication facts 1–10 × 1–10; keys match the mult generator ("axb")
      for (let a = 1; a <= 10; a++) {
        for (let b = 1; b <= 10; b++) {
          const key = `${a}x${b}`
          pool.push({ a, b, answer: a * b, key, weight: calcWeight(userStats, key), operation: '×' })
        }
      }
    } else if (op === '+') {
      // a, b ∈ [1,10]; result ≤ 20 (always satisfied since max is 10+10=20)
      for (let a = 1; a <= 10; a++) {
        for (let b = 1; b <= 10; b++) {
          const key = `${a}+${b}`
          pool.push({ a, b, answer: a + b, key, weight: calcWeight(userStats, key), operation: '+' })
        }
      }
    } else if (op === '-') {
      // a ∈ [2,20], b ∈ [1, min(a−1, 10)]; result always positive
      for (let a = 2; a <= 20; a++) {
        for (let b = 1; b <= Math.min(a - 1, 10); b++) {
          const key = `${a}-${b}`
          pool.push({ a, b, answer: a - b, key, weight: calcWeight(userStats, key), operation: '−' })
        }
      }
    } else if (op === '÷') {
      // Derived from multiplication facts: (divisor × quotient) ÷ divisor = quotient
      // divisor, quotient ∈ [1,10] — always whole number results
      for (let divisor = 1; divisor <= 10; divisor++) {
        for (let quotient = 1; quotient <= 10; quotient++) {
          const dividend = divisor * quotient
          const key = `${dividend}÷${divisor}`
          pool.push({
            a: dividend,
            b: divisor,
            answer: quotient,
            key,
            weight: calcWeight(userStats, key),
            operation: '÷',
          })
        }
      }
    }
  }

  return pool
}

/**
 * Generate a 20-question list for the operations game.
 * Uses the same adaptive weighting and cap/gap/spacing rules as `generate()`.
 *
 * @param ops       - Selected operations ('+', '-', '÷').
 * @param userStats - Per-user error stats for weighting.
 * @param rng       - Injectable RNG for deterministic tests.
 */
export function generateOps(
  ops: Operation[],
  userStats: UserStats,
  rng: () => number = Math.random,
): Question[] {
  const pool = buildPool(ops, userStats)

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

    // Absolute fallback
    if (candidates.length === 0) candidates = pool

    const picked = weightedPick(candidates)
    questions.push(picked)
    counts[picked.key] = (counts[picked.key] ?? 0) + 1
    lastPos[picked.key] = i
  }

  return questions
}
