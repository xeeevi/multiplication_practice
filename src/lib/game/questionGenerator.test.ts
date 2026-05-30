import { describe, it, expect } from 'vitest'
import { generate, calcWeight } from './questionGenerator'
import type { UserStats } from '../../types'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Deterministic RNG based on a seed (simple LCG). */
function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function count(questions: ReturnType<typeof generate>, key: string): number {
  return questions.filter((q) => q.key === key).length
}

const EMPTY_STATS: UserStats = {}

// ── calcWeight ─────────────────────────────────────────────────────────────

describe('calcWeight', () => {
  it('returns 1 for a fact with no attempts', () => {
    expect(calcWeight(EMPTY_STATS, '7x8')).toBe(1)
  })

  it('returns 1 for a fact with no errors', () => {
    const stats: UserStats = { '7x8': { attempts: 10, errors: 0 } }
    expect(calcWeight(stats, '7x8')).toBe(1)
  })

  it('returns ~3 for a fact failed every time with 5+ attempts', () => {
    const stats: UserStats = { '7x8': { attempts: 5, errors: 5 } }
    const w = calcWeight(stats, '7x8')
    expect(w).toBeCloseTo(3)
  })

  it('scales with confidence (fewer attempts → lower boost)', () => {
    const full:  UserStats = { '6x7': { attempts: 5,  errors: 5  } }
    const half:  UserStats = { '6x7': { attempts: 2,  errors: 2  } }
    expect(calcWeight(full, '6x7')).toBeGreaterThan(calcWeight(half, '6x7'))
  })

  it('stays in range [1, 3]', () => {
    const extreme: UserStats = { '9x9': { attempts: 100, errors: 100 } }
    const w = calcWeight(extreme, '9x9')
    expect(w).toBeGreaterThanOrEqual(1)
    expect(w).toBeLessThanOrEqual(3)
  })
})

// ── generate ───────────────────────────────────────────────────────────────

describe('generate', () => {
  it('returns exactly 20 questions', () => {
    const qs = generate([3, 7], EMPTY_STATS, makeRng(1))
    expect(qs).toHaveLength(20)
  })

  it('only includes questions from selected tables', () => {
    const tables = [5, 9]
    const qs = generate(tables, EMPTY_STATS, makeRng(2))
    qs.forEach((q) => expect(tables).toContain(q.a))
  })

  it('no fact appears more than 4 times', () => {
    for (let seed = 0; seed < 20; seed++) {
      const qs = generate([3], EMPTY_STATS, makeRng(seed))
      const keys = new Set(qs.map((q) => q.key))
      keys.forEach((k) => expect(count(qs, k)).toBeLessThanOrEqual(4))
    }
  })

  it('enforces ≥2 gap between repeats of the same fact (when pool allows)', () => {
    // With 2+ tables (20+ unique pairs), cap and spacing should both hold
    for (let seed = 0; seed < 15; seed++) {
      const qs = generate([3, 7], EMPTY_STATS, makeRng(seed))
      const lastSeen: Record<string, number> = {}
      qs.forEach((q, i) => {
        const lp = lastSeen[q.key]
        if (lp !== undefined) {
          expect(i - lp).toBeGreaterThan(2) // MIN_GAP = 2, so diff must be > 2
        }
        lastSeen[q.key] = i
      })
    }
  })

  it('works with a single table (10 unique pairs)', () => {
    for (let seed = 0; seed < 10; seed++) {
      const qs = generate([6], EMPTY_STATS, makeRng(seed))
      expect(qs).toHaveLength(20)
      qs.forEach((q) => expect(q.a).toBe(6))
    }
  })

  it('never has two identical questions back-to-back', () => {
    for (let seed = 0; seed < 30; seed++) {
      const qs = generate([3, 7, 9], EMPTY_STATS, makeRng(seed))
      for (let i = 1; i < qs.length; i++) {
        expect(qs[i]!.key).not.toBe(qs[i - 1]!.key)
      }
    }
  })

  it('with empty stats all weights equal 1 (uniform sampling)', () => {
    const qs = generate([4], EMPTY_STATS, makeRng(99))
    qs.forEach((q) => expect(q.weight).toBe(1))
  })

  it('boosts a frequently-failed fact to appear more than an unseen fact', () => {
    const failedKey = '7x8'
    const stats: UserStats = { [failedKey]: { attempts: 5, errors: 5 } }

    let failedTotal = 0
    let freshTotal  = 0
    const RUNS = 50

    for (let seed = 0; seed < RUNS; seed++) {
      const qs = generate([7], stats, makeRng(seed))
      failedTotal += count(qs, failedKey)
      // pick an unseen fact from the same table
      freshTotal  += count(qs, '7x2')
    }

    // Over many runs the boosted fact should average more appearances
    expect(failedTotal).toBeGreaterThan(freshTotal)
  })
})
