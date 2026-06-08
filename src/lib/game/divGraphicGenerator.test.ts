import { describe, it, expect } from 'vitest'
import { generateDivGraphic, buildDivPool } from './divGraphicGenerator'
import type { UserStats } from '../../types'
import { MAX_REPEAT } from './constants'

function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const EMPTY: UserStats = {}

describe('buildDivPool', () => {
  it('contains only valid questions', () => {
    const pool = buildDivPool(EMPTY)
    expect(pool.length).toBeGreaterThan(50)
    for (const q of pool) {
      expect(q.b).toBeGreaterThanOrEqual(2)
      expect(q.b).toBeLessThanOrEqual(10)
      expect(q.answer).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBe(Math.floor(q.a / q.b))
      expect(q.remainder).toBe(q.a % q.b)
      expect(q.operation).toBe('÷')
      expect(q.weight).toBeGreaterThan(0)

      const T = Math.floor(q.a / 10)
      expect(T).toBeLessThanOrEqual(6)

      const barsToBreak = q.answer >= 10 ? T % q.b : T
      expect(barsToBreak).toBeLessThanOrEqual(1)
    }
  })

  it('has no trivial quotients (Q < 2)', () => {
    const pool = buildDivPool(EMPTY)
    pool.forEach(q => expect(q.answer).toBeGreaterThanOrEqual(2))
  })
})

describe('generateDivGraphic', () => {
  it('always returns exactly 20 questions', () => {
    for (let seed = 0; seed < 10; seed++) {
      expect(generateDivGraphic(EMPTY, makeRng(seed))).toHaveLength(20)
    }
  })

  it('every question has correct answer and remainder', () => {
    for (let seed = 0; seed < 10; seed++) {
      const qs = generateDivGraphic(EMPTY, makeRng(seed))
      qs.forEach(q => {
        expect(q.answer).toBe(Math.floor(q.a / q.b))
        expect(q.remainder).toBe(q.a % q.b)
        expect(q.b).toBeGreaterThanOrEqual(2)
        expect(q.b).toBeLessThanOrEqual(10)
        expect(q.answer).toBeGreaterThanOrEqual(2)
      })
    }
  })

  it('all questions require at most 1 bar break', () => {
    for (let seed = 0; seed < 15; seed++) {
      const qs = generateDivGraphic(EMPTY, makeRng(seed))
      qs.forEach(q => {
        const T = Math.floor(q.a / 10)
        const barsToBreak = q.answer >= 10 ? T % q.b : T
        expect(barsToBreak).toBeLessThanOrEqual(1)
        expect(T).toBeLessThanOrEqual(6)
      })
    }
  })

  it('no fact appears more than MAX_REPEAT times per round', () => {
    for (let seed = 0; seed < 15; seed++) {
      const qs = generateDivGraphic(EMPTY, makeRng(seed))
      const counts: Record<string, number> = {}
      qs.forEach(q => { counts[q.key] = (counts[q.key] ?? 0) + 1 })
      Object.values(counts).forEach(c => expect(c).toBeLessThanOrEqual(MAX_REPEAT))
    }
  })

  it('never has two identical questions back-to-back', () => {
    for (let seed = 0; seed < 30; seed++) {
      const qs = generateDivGraphic(EMPTY, makeRng(seed))
      for (let i = 1; i < qs.length; i++) {
        expect(qs[i]!.key).not.toBe(qs[i - 1]!.key)
      }
    }
  })

  it('includes divisors > 4 across multiple runs', () => {
    const divisorsSeen = new Set<number>()
    for (let seed = 0; seed < 30; seed++) {
      generateDivGraphic(EMPTY, makeRng(seed)).forEach(q => divisorsSeen.add(q.b))
    }
    expect(divisorsSeen.size).toBeGreaterThan(4)
  })

  it('boosts a frequently-failed fact', () => {
    const failedKey = '24÷2'
    const stats: UserStats = { [failedKey]: { attempts: 5, errors: 5 } }
    let failedTotal = 0
    let freshTotal = 0
    const RUNS = 50
    for (let seed = 0; seed < RUNS; seed++) {
      const qs = generateDivGraphic(stats, makeRng(seed))
      failedTotal += qs.filter(q => q.key === failedKey).length
      freshTotal += qs.filter(q => q.key === '22÷2').length
    }
    expect(failedTotal).toBeGreaterThan(freshTotal)
  })
})
