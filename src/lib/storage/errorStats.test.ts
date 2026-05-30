import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getUserKey,
  getAllErrorStats,
  getErrorStats,
  saveErrorStat,
  getWeakProblems,
} from './errorStats'
import { STORAGE_KEYS } from '../game/constants'

// Lightweight in-memory localStorage stub (avoids jsdom/Node.js 26 conflicts)
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

// ── getUserKey ─────────────────────────────────────────────────────────────

describe('getUserKey', () => {
  it('lowercases the name', () => {
    expect(getUserKey('Maria')).toBe('maria')
    expect(getUserKey('PAU')).toBe('pau')
  })

  it('trims whitespace', () => {
    expect(getUserKey('  maria  ')).toBe('maria')
  })

  it('returns _default for empty string', () => {
    expect(getUserKey('')).toBe('_default')
    expect(getUserKey('   ')).toBe('_default')
  })
})

// ── getAllErrorStats — migration ───────────────────────────────────────────

describe('getAllErrorStats migration', () => {
  it('migrates old flat format into { _default: ... }', () => {
    // Seed the old format
    const legacy = { '7x8': { attempts: 4, errors: 3 }, '6x9': { attempts: 2, errors: 1 } }
    localStorage.setItem(STORAGE_KEYS.errors, JSON.stringify(legacy))

    const all = getAllErrorStats()
    expect(all._default).toBeDefined()
    expect(all._default!['7x8']).toEqual({ attempts: 4, errors: 3 })
    // Original top-level keys should be gone
    expect(all['7x8']).toBeUndefined()
  })

  it('persists the migrated format so migration runs only once', () => {
    const legacy = { '5x5': { attempts: 1, errors: 1 } }
    localStorage.setItem(STORAGE_KEYS.errors, JSON.stringify(legacy))

    getAllErrorStats() // triggers migration

    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.errors)!)
    expect(raw._default).toBeDefined()
    expect(raw['5x5']).toBeUndefined() // flat key removed
  })

  it('does not migrate the new nested format', () => {
    const nested = { maria: { '7x8': { attempts: 2, errors: 1 } } }
    localStorage.setItem(STORAGE_KEYS.errors, JSON.stringify(nested))

    const all = getAllErrorStats()
    expect(all.maria).toBeDefined()
    expect(all._default).toBeUndefined()
  })
})

// ── saveErrorStat / getErrorStats — per-user partitioning ──────────────────

describe('saveErrorStat', () => {
  it('increments attempts and errors correctly', () => {
    saveErrorStat('maria', '7x8', false)
    saveErrorStat('maria', '7x8', false)
    saveErrorStat('maria', '7x8', true)

    const stats = getErrorStats('maria')
    expect(stats['7x8']).toEqual({ attempts: 3, errors: 2 })
  })

  it('isolates users — maria does not affect pau', () => {
    saveErrorStat('maria', '7x8', false)
    saveErrorStat('pau',   '6x9', false)

    expect(getErrorStats('maria')['6x9']).toBeUndefined()
    expect(getErrorStats('pau')['7x8']).toBeUndefined()
  })

  it('is case-insensitive ("Maria" and "maria" share the same bucket)', () => {
    saveErrorStat('Maria', '7x8', false)
    saveErrorStat('maria', '7x8', false)
    expect(getErrorStats('MARIA')['7x8']?.attempts).toBe(2)
  })

  it('blank / whitespace name falls into _default bucket', () => {
    saveErrorStat('', '3x4', false)
    const all = getAllErrorStats()
    expect(all['_default']?.['3x4']).toBeDefined()
  })

  it('supports ops-style keys with a custom storage key', () => {
    saveErrorStat('maria', '14+7', false, 'ops_practice_errors')
    const stats = getErrorStats('maria', 'ops_practice_errors')
    expect(stats['14+7']).toEqual({ attempts: 1, errors: 1 })
    // mult storage unaffected
    expect(getErrorStats('maria')['14+7']).toBeUndefined()
  })
})

// ── getWeakProblems ─────────────────────────────────────────────────────────

describe('getWeakProblems', () => {
  it('returns empty array when no data', () => {
    expect(getWeakProblems('nobody')).toEqual([])
  })

  it('only returns pairs with ≥3 attempts AND >40% error rate', () => {
    // 5/5 errors → 100% — should appear
    saveErrorStat('test', '7x8', false)
    saveErrorStat('test', '7x8', false)
    saveErrorStat('test', '7x8', false)
    saveErrorStat('test', '7x8', false)
    saveErrorStat('test', '7x8', false)

    // 1/3 errors → 33% — should NOT appear
    saveErrorStat('test', '6x9', false)
    saveErrorStat('test', '6x9', true)
    saveErrorStat('test', '6x9', true)

    const weak = getWeakProblems('test')
    expect(weak.some((w) => w.a === 7 && w.b === 8)).toBe(true)
    expect(weak.some((w) => w.a === 6 && w.b === 9)).toBe(false)
  })

  it('requires at least 3 attempts (2 is not enough even at 100% error)', () => {
    saveErrorStat('test2', '9x9', false)
    saveErrorStat('test2', '9x9', false)
    expect(getWeakProblems('test2')).toHaveLength(0)
  })
})
