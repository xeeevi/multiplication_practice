import { describe, it, expect } from 'vitest'
import { generateOps } from './opsQuestionGenerator'
import type { UserStats, Operation } from '../../types'

function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const EMPTY: UserStats = {}
const ALL_OPS: Operation[] = ['+', '-', '÷']

describe('generateOps', () => {
  it('always returns exactly 20 questions', () => {
    for (let seed = 0; seed < 10; seed++) {
      expect(generateOps(ALL_OPS, EMPTY, makeRng(seed))).toHaveLength(20)
    }
  })

  it('only includes questions from selected operations', () => {
    const addOnly = generateOps(['+'], EMPTY, makeRng(1))
    addOnly.forEach((q) => expect(q.operation).toBe('+'))

    const subOnly = generateOps(['-'], EMPTY, makeRng(2))
    subOnly.forEach((q) => expect(q.operation).toBe('−'))

    const divOnly = generateOps(['÷'], EMPTY, makeRng(3))
    divOnly.forEach((q) => expect(q.operation).toBe('÷'))
  })

  it('no subtraction result is negative or zero', () => {
    for (let seed = 0; seed < 20; seed++) {
      const qs = generateOps(['-'], EMPTY, makeRng(seed))
      qs.forEach((q) => {
        expect(q.answer).toBeGreaterThan(0)
        expect(q.a).toBeGreaterThan(q.b)
      })
    }
  })

  it('all division results have correct quotient and remainder', () => {
    for (let seed = 0; seed < 10; seed++) {
      const qs = generateOps(['÷'], EMPTY, makeRng(seed))
      qs.forEach((q) => {
        expect(q.answer).toBe(Math.floor(q.a / q.b))
        expect(q.remainder).toBe(q.a % q.b)
        expect(q.b).toBeGreaterThanOrEqual(2)
        expect(q.answer).toBeGreaterThanOrEqual(1)
        expect(q.a).toBeLessThanOrEqual(99)
      })
    }
  })

  it('addition results are ≤ 20', () => {
    for (let seed = 0; seed < 10; seed++) {
      const qs = generateOps(['+'], EMPTY, makeRng(seed))
      qs.forEach((q) => expect(q.answer).toBeLessThanOrEqual(20))
    }
  })

  it('no fact appears more than 4 times per round', () => {
    for (let seed = 0; seed < 15; seed++) {
      const qs = generateOps(ALL_OPS, EMPTY, makeRng(seed))
      const counts: Record<string, number> = {}
      qs.forEach((q) => { counts[q.key] = (counts[q.key] ?? 0) + 1 })
      Object.values(counts).forEach((c) => expect(c).toBeLessThanOrEqual(4))
    }
  })

  it('enforces ≥2 gap between repeats when pool is large enough', () => {
    // Use all ops — large pool, spacing should hold
    for (let seed = 0; seed < 15; seed++) {
      const qs = generateOps(ALL_OPS, EMPTY, makeRng(seed))
      const lastSeen: Record<string, number> = {}
      qs.forEach((q, i) => {
        const lp = lastSeen[q.key]
        if (lp !== undefined) {
          expect(i - lp).toBeGreaterThan(2)
        }
        lastSeen[q.key] = i
      })
    }
  })

  it('never has two identical questions back-to-back', () => {
    for (let seed = 0; seed < 30; seed++) {
      const qs = generateOps(ALL_OPS, EMPTY, makeRng(seed))
      for (let i = 1; i < qs.length; i++) {
        expect(qs[i]!.key).not.toBe(qs[i - 1]!.key)
      }
    }
  })

  it('works with a single operation', () => {
    const qs = generateOps(['+'], EMPTY, makeRng(42))
    expect(qs).toHaveLength(20)
    qs.forEach((q) => expect(q.operation).toBe('+'))
  })

  it('with empty stats all weights equal 1 (uniform)', () => {
    const qs = generateOps(ALL_OPS, EMPTY, makeRng(7))
    qs.forEach((q) => expect(q.weight).toBe(1))
  })

  it('includes multiplication questions when × is selected', () => {
    const qs = generateOps(['×'], EMPTY, makeRng(5))
    expect(qs).toHaveLength(20)
    qs.forEach((q) => {
      expect(q.operation).toBe('×')
      expect(q.answer).toBe(q.a * q.b)
      expect(q.key).toMatch(/^\d+x\d+$/)
    })
  })

  it('restricts × to specified tables when tables param is provided', () => {
    const tables = [2, 5]
    const qs = generateOps(['×'], EMPTY, makeRng(9), tables)
    expect(qs).toHaveLength(20)
    qs.forEach((q) => {
      expect(q.operation).toBe('×')
      expect(tables).toContain(q.a)
    })
  })

  it('× table restriction does not affect other ops in a mixed round', () => {
    const tables = [3]
    const qs = generateOps(['+', '×'], EMPTY, makeRng(11), tables)
    const multQs = qs.filter(q => q.operation === '×')
    multQs.forEach(q => expect(q.a).toBe(3))
    const addQs = qs.filter(q => q.operation === '+')
    // addition questions should use full 1–10 range
    const aValues = new Set(addQs.map(q => q.a))
    expect(aValues.size).toBeGreaterThan(1)
  })

  it('boosts a frequently-failed fact to appear more than an unseen fact', () => {
    const failedKey = '7+8'  // a,b ∈ [1,10] — valid in the pool
    const stats: UserStats = { [failedKey]: { attempts: 5, errors: 5 } }

    let failedTotal = 0
    let freshTotal  = 0
    const RUNS = 50

    for (let seed = 0; seed < RUNS; seed++) {
      const qs = generateOps(['+'], stats, makeRng(seed))
      failedTotal += qs.filter((q) => q.key === failedKey).length
      freshTotal  += qs.filter((q) => q.key === '3+4').length
    }

    expect(failedTotal).toBeGreaterThan(freshTotal)
  })
})
