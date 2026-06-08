// ---------------------------------------------------------------------------
// Shared domain types for the multiplication practice app
// ---------------------------------------------------------------------------

export type Lang = 'ca' | 'es' | 'en'

export type Mode = 'free' | '5' | '10' | '20'

export type Screen = 'setup' | 'game' | 'results' | 'leaderboard'

export type Operation = '×' | '+' | '-' | '÷'

export type GameType = 'mult' | 'ops' | 'divg'

/** A single question with pre-computed adaptive weight. */
export interface Question {
  a: number
  b: number
  answer: number
  /** Composite key used for tracking, e.g. "7x8", "14+7", "6÷2" */
  key: string
  /** Sampling weight in [1, 3]; higher = more likely to appear this round. */
  weight: number
  /** Symbol to display between operands: '×', '+', '−', '÷' */
  operation: string
  /** Integer remainder — only present for divg (graphical division) questions. */
  remainder?: number
}

/** One saved high-score entry (persisted to localStorage). */
export interface ScoreEntry {
  name: string
  score: number
  correct: number
  wrong: number
  bestStreak: number
  tables: number[]
  mode: Mode
  date: string
}

/** Per-pair attempt/error counters for one user. */
export interface PairStats {
  attempts: number
  errors: number
}

/** All problem stats for one user: key → {attempts, errors} */
export type UserStats = Record<string, PairStats>

/** Top-level error-stats structure partitioned by user key. */
export type AllErrorStats = Record<string, UserStats>

/** Summary passed to the Results screen after a game ends. */
export interface GameResult {
  score: number
  correct: number
  wrong: number
  bestStreak: number
  isNewRecord: boolean
  mode: Mode
}
