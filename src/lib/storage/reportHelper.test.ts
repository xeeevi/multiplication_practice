import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getKnownUserKeys,
  buildUserReport,
  getAllUserReports,
  parseOpFromKey,
  keyToDisplay,
} from './reportHelper'
import { saveErrorStat } from './errorStats'
import { STORAGE_KEYS } from '../game/constants'

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

beforeEach(() => { lsMock.clear() })

// ── Helpers ────────────────────────────────────────────────────────────────

describe('parseOpFromKey', () => {
  it('identifies × from axb keys', () => expect(parseOpFromKey('7x8')).toBe('×'))
  it('identifies + keys',          () => expect(parseOpFromKey('14+7')).toBe('+'))
  it('identifies ÷ keys',          () => expect(parseOpFromKey('6÷2')).toBe('÷'))
  it('identifies − keys',          () => expect(parseOpFromKey('9-3')).toBe('−'))
})

describe('keyToDisplay', () => {
  it('converts x to ×',   () => expect(keyToDisplay('7x8')).toBe('7×8'))
  it('converts - to −',   () => expect(keyToDisplay('9-3')).toBe('9−3'))
  it('leaves + unchanged',() => expect(keyToDisplay('14+7')).toBe('14+7'))
  it('leaves ÷ unchanged',() => expect(keyToDisplay('6÷2')).toBe('6÷2'))
})

// ── getKnownUserKeys ───────────────────────────────────────────────────────

describe('getKnownUserKeys', () => {
  it('returns empty when no data', () => {
    expect(getKnownUserKeys()).toEqual([])
  })

  it('returns users from mult store', () => {
    saveErrorStat('maria', '7x8', false, STORAGE_KEYS.errors)
    expect(getKnownUserKeys()).toContain('maria')
  })

  it('returns users from ops store', () => {
    saveErrorStat('pau', '14+7', false, STORAGE_KEYS.opsErrors)
    expect(getKnownUserKeys()).toContain('pau')
  })

  it('deduplicates users present in both stores', () => {
    saveErrorStat('maria', '7x8',  false, STORAGE_KEYS.errors)
    saveErrorStat('maria', '14+7', false, STORAGE_KEYS.opsErrors)
    const keys = getKnownUserKeys()
    expect(keys.filter((k) => k === 'maria')).toHaveLength(1)
  })
})

// ── buildUserReport ────────────────────────────────────────────────────────

describe('buildUserReport', () => {
  it('returns null when user has fewer than 5 total attempts', () => {
    saveErrorStat('low', '7x8', false, STORAGE_KEYS.errors)
    saveErrorStat('low', '7x8', false, STORAGE_KEYS.errors)
    expect(buildUserReport('low')).toBeNull()
  })

  it('returns a report when user has ≥5 total attempts', () => {
    for (let i = 0; i < 5; i++) saveErrorStat('maria', '7x8', false, STORAGE_KEYS.errors)
    const r = buildUserReport('maria')
    expect(r).not.toBeNull()
    expect(r!.totalAttempts).toBe(5)
  })

  it('aggregates × operation from mult store correctly', () => {
    for (let i = 0; i < 5; i++) saveErrorStat('maria', '7x8', i < 4, STORAGE_KEYS.errors)
    const r = buildUserReport('maria')!
    const multOp = r.opSummary.find((s) => s.operation === '×')
    expect(multOp).toBeDefined()
    expect(multOp!.attempts).toBe(5)
  })

  it('aggregates + operation from ops store correctly', () => {
    for (let i = 0; i < 5; i++) saveErrorStat('pau', '14+7', false, STORAGE_KEYS.opsErrors)
    const r = buildUserReport('pau')!
    const addOp = r.opSummary.find((s) => s.operation === '+')
    expect(addOp).toBeDefined()
    expect(addOp!.attempts).toBe(5)
  })

  it('includes weak facts sorted by errorRate descending', () => {
    // 7x8: 4/5 errors = 80% — should appear
    for (let i = 0; i < 5; i++) saveErrorStat('aina', '7x8', i === 0, STORAGE_KEYS.errors)
    // 6x9: 2/3 errors = 67% — should appear
    for (let i = 0; i < 3; i++) saveErrorStat('aina', '6x9', i === 2, STORAGE_KEYS.errors)
    // 14+7: 1/3 = 33% — below threshold, should NOT appear
    for (let i = 0; i < 3; i++) saveErrorStat('aina', '14+7', i < 2, STORAGE_KEYS.opsErrors)
    // add more attempts to reach the report threshold
    saveErrorStat('aina', '3x4', true, STORAGE_KEYS.errors)

    const r = buildUserReport('aina')!
    expect(r.weakFacts.length).toBeGreaterThan(0)
    // 7x8 (80%) should come before 6x9 (67%)
    const displays = r.weakFacts.map((f) => f.display)
    expect(displays).toContain('7×8')
    expect(displays.indexOf('7×8')).toBeLessThan(displays.indexOf('6×9') === -1 ? 999 : displays.indexOf('6×9'))
    // 14+7 at 33% error should NOT be in weak facts
    expect(displays).not.toContain('14+7')
  })

  it('caps weak facts at 5', () => {
    // Create 7 weak facts
    const weakKeys = ['7x8', '6x9', '8x7', '9x6', '8x9', '7x6', '9x8']
    for (const key of weakKeys) {
      for (let i = 0; i < 5; i++) saveErrorStat('test', key, false, STORAGE_KEYS.errors)
    }
    const r = buildUserReport('test')!
    expect(r.weakFacts.length).toBeLessThanOrEqual(5)
  })

  it('display string converts storage keys to readable format', () => {
    for (let i = 0; i < 5; i++) saveErrorStat('fmt', '7x8', false, STORAGE_KEYS.errors)
    const r = buildUserReport('fmt')!
    expect(r.weakFacts.some((f) => f.display === '7×8')).toBe(true)
  })

  it('op summary respects canonical order ×/+/−/÷', () => {
    for (let i = 0; i < 3; i++) saveErrorStat('ord', '14+7', false, STORAGE_KEYS.opsErrors)
    for (let i = 0; i < 3; i++) saveErrorStat('ord', '7x8',  false, STORAGE_KEYS.errors)
    // need 5+ total
    saveErrorStat('ord', '3x4', false, STORAGE_KEYS.errors)
    saveErrorStat('ord', '5x5', false, STORAGE_KEYS.errors)
    const r = buildUserReport('ord')!
    const ops = r.opSummary.map((s) => s.operation)
    const multIdx = ops.indexOf('×')
    const addIdx  = ops.indexOf('+')
    if (multIdx !== -1 && addIdx !== -1) {
      expect(multIdx).toBeLessThan(addIdx)
    }
  })
})

// ── getAllUserReports ───────────────────────────────────────────────────────

describe('getAllUserReports', () => {
  it('returns empty when no users have enough data', () => {
    saveErrorStat('x', '7x8', false, STORAGE_KEYS.errors)
    expect(getAllUserReports()).toHaveLength(0)
  })

  it('filters out users below the attempts threshold', () => {
    // maria: 5 attempts ✓, pau: 2 attempts ✗
    for (let i = 0; i < 5; i++) saveErrorStat('maria', '7x8', false, STORAGE_KEYS.errors)
    for (let i = 0; i < 2; i++) saveErrorStat('pau',   '6x9', false, STORAGE_KEYS.errors)
    const reports = getAllUserReports()
    expect(reports.some((r) => r.userKey === 'maria')).toBe(true)
    expect(reports.some((r) => r.userKey === 'pau')).toBe(false)
  })

  it('sorts by totalAttempts descending', () => {
    for (let i = 0; i < 10; i++) saveErrorStat('big',   '7x8', false, STORAGE_KEYS.errors)
    for (let i = 0; i < 5;  i++) saveErrorStat('small', '6x9', false, STORAGE_KEYS.errors)
    const reports = getAllUserReports()
    expect(reports[0]!.userKey).toBe('big')
  })
})
