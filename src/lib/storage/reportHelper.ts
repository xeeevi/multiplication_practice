import { getAllErrorStats } from './errorStats'
import { STORAGE_KEYS } from '../game/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FactReport {
  display: string   // human-readable: "7×8", "14+7", "9−3", "6÷2"
  attempts: number
  errors: number
  errorRate: number
  operation: string // '×', '+', '−', '÷'
}

export interface OpSummary {
  operation: string
  attempts: number
  errors: number
  errorRate: number
}

export interface UserReport {
  userKey: string
  opSummary: OpSummary[]  // ops with data, ordered ×/+/−/÷
  weakFacts: FactReport[] // top 5 by errorRate desc (≥3 attempts, >40% error)
  totalAttempts: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_ATTEMPTS_FOR_REPORT = 5
const MIN_ATTEMPTS_FOR_WEAK = 3
const WEAK_ERROR_THRESHOLD = 0.4
const OP_ORDER = ['×', '+', '−', '÷']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Infer the operation symbol from a storage key. */
export function parseOpFromKey(key: string): string {
  if (/^\d+x\d+$/.test(key)) return '×'
  if (key.includes('+')) return '+'
  if (key.includes('÷')) return '÷'
  if (key.includes('-')) return '−'
  return '?'
}

/** Convert a storage key to a human-readable equation term. */
export function keyToDisplay(key: string): string {
  return key.replace('x', '×').replace('-', '−')
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * All user keys that have any data in either error store, sorted alphabetically.
 * Returns '_default' only if it has actual data.
 */
export function getKnownUserKeys(): string[] {
  const multAll = getAllErrorStats(STORAGE_KEYS.errors)
  const opsAll  = getAllErrorStats(STORAGE_KEYS.opsErrors)
  const keys = new Set([...Object.keys(multAll), ...Object.keys(opsAll)])
  return Array.from(keys).sort()
}

/**
 * Build a full report for one user across both error stores.
 * Returns null if the user doesn't have enough data yet (< 5 total attempts).
 */
export function buildUserReport(userKey: string): UserReport | null {
  const multStats = getAllErrorStats(STORAGE_KEYS.errors)[userKey]  ?? {}
  const opsStats  = getAllErrorStats(STORAGE_KEYS.opsErrors)[userKey] ?? {}

  // Aggregate attempts/errors per operation, keeping both stores separate
  const opMap: Record<string, { attempts: number; errors: number }> = {}

  // Raw facts for weak-fact detection (prefixed to avoid key collisions across stores)
  const facts: Array<{ compositeKey: string; key: string; attempts: number; errors: number; op: string }> = []

  for (const [key, val] of Object.entries(multStats)) {
    const op = parseOpFromKey(key)
    if (!opMap[op]) opMap[op] = { attempts: 0, errors: 0 }
    opMap[op].attempts += val.attempts
    opMap[op].errors   += val.errors
    facts.push({ compositeKey: `mult:${key}`, key, attempts: val.attempts, errors: val.errors, op })
  }

  for (const [key, val] of Object.entries(opsStats)) {
    const op = parseOpFromKey(key)
    if (!opMap[op]) opMap[op] = { attempts: 0, errors: 0 }
    opMap[op].attempts += val.attempts
    opMap[op].errors   += val.errors
    facts.push({ compositeKey: `ops:${key}`, key, attempts: val.attempts, errors: val.errors, op })
  }

  const totalAttempts = Object.values(opMap).reduce((s, v) => s + v.attempts, 0)
  if (totalAttempts < MIN_ATTEMPTS_FOR_REPORT) return null

  // Op summary — only ops with data, in canonical order
  const opSummary: OpSummary[] = OP_ORDER
    .filter((op) => opMap[op])
    .map((op) => ({
      operation: op,
      attempts:  opMap[op]!.attempts,
      errors:    opMap[op]!.errors,
      errorRate: opMap[op]!.errors / opMap[op]!.attempts,
    }))

  // Weak facts
  const weakFacts: FactReport[] = facts
    .filter((f) => f.attempts >= MIN_ATTEMPTS_FOR_WEAK && f.errors / f.attempts > WEAK_ERROR_THRESHOLD)
    .sort((a, b) => b.errors / b.attempts - a.errors / a.attempts)
    .slice(0, 5)
    .map((f) => ({
      display:   keyToDisplay(f.key),
      attempts:  f.attempts,
      errors:    f.errors,
      errorRate: f.errors / f.attempts,
      operation: f.op,
    }))

  return { userKey, opSummary, weakFacts, totalAttempts }
}

/**
 * All user reports with enough data, sorted by totalAttempts descending
 * (most active users first).
 */
export function getAllUserReports(): UserReport[] {
  return getKnownUserKeys()
    .map(buildUserReport)
    .filter((r): r is UserReport => r !== null)
    .sort((a, b) => b.totalAttempts - a.totalAttempts)
}
