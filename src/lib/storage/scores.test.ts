import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getScores, saveScore, clearScores, filterScores } from './scores'

function makeLocalStorageStub() {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
}

const lsMock = makeLocalStorageStub()
vi.stubGlobal('localStorage', lsMock)

beforeEach(() => {
  lsMock.clear()
})

describe('saveScore', () => {
  it('persists a score entry', () => {
    saveScore('maria', 120, 10, 2, 5, [3, 7], 'free')
    const scores = getScores()
    expect(scores).toHaveLength(1)
    expect(scores[0]!.name).toBe('maria')
    expect(scores[0]!.score).toBe(120)
  })

  it('sorts scores descending by score', () => {
    saveScore('a', 50, 5, 5, 2, [3], 'free')
    saveScore('b', 200, 18, 2, 8, [7], '5')
    saveScore('c', 100, 10, 10, 4, [9], '10')
    const scores = getScores()
    expect(scores[0]!.score).toBe(200)
    expect(scores[1]!.score).toBe(100)
    expect(scores[2]!.score).toBe(50)
  })

  it('caps stored entries at 50', () => {
    for (let i = 0; i < 55; i++) {
      saveScore(`player${i}`, i * 10, 10, 0, 5, [3], 'free')
    }
    expect(getScores().length).toBeLessThanOrEqual(50)
  })

  it('returns true when the new score beats the current record', () => {
    const first = saveScore('a', 100, 10, 0, 5, [3], 'free')
    expect(first).toBe(true) // first entry is always a record
    const second = saveScore('b', 50, 5, 5, 2, [3], 'free')
    expect(second).toBe(false) // 50 < 100
    const third = saveScore('c', 200, 20, 0, 10, [3], 'free')
    expect(third).toBe(true) // 200 > 100
  })

  it('does not mark a zero score as a record', () => {
    const result = saveScore('a', 0, 0, 20, 0, [3], 'free')
    expect(result).toBe(false)
  })

  it('sorts tables ascending before saving', () => {
    saveScore('a', 100, 10, 0, 5, [9, 3, 7], 'free')
    expect(getScores()[0]!.tables).toEqual([3, 7, 9])
  })
})

describe('clearScores', () => {
  it('removes all scores', () => {
    saveScore('a', 100, 10, 0, 5, [3], 'free')
    clearScores()
    expect(getScores()).toHaveLength(0)
  })
})

describe('filterScores', () => {
  it('returns all scores for filter "all"', () => {
    const scores = [
      { name: 'a', score: 100, correct: 10, wrong: 0, bestStreak: 5, tables: [3], mode: 'free' as const, date: '' },
      { name: 'b', score: 200, correct: 18, wrong: 2, bestStreak: 8, tables: [7], mode: '5'    as const, date: '' },
    ]
    expect(filterScores(scores, 'all')).toHaveLength(2)
  })

  it('filters by specific mode', () => {
    const scores = [
      { name: 'a', score: 100, correct: 10, wrong: 0, bestStreak: 5, tables: [3], mode: 'free' as const, date: '' },
      { name: 'b', score: 200, correct: 18, wrong: 2, bestStreak: 8, tables: [7], mode: '5'    as const, date: '' },
    ]
    const free = filterScores(scores, 'free')
    expect(free).toHaveLength(1)
    expect(free[0]!.mode).toBe('free')
  })
})
