// ---------------------------------------------------------------------------
// Shared domain types for the multiplication practice app
// ---------------------------------------------------------------------------

export type Lang = 'ca' | 'es' | 'en'

export type Mode = 'free' | '5' | '10' | '20'

export type Screen = 'setup' | 'game' | 'results' | 'leaderboard'

/** A single multiplication question with pre-computed adaptive weight. */
export interface Question {
  a: number
  b: number
  answer: number
  /** Composite key used for tracking: "AxB" */
  key: string
  /** Sampling weight in [1, 3]; higher = more likely to appear this round. */
  weight: number
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

/** All problem stats for one user: "AxB" → {attempts, errors} */
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
