import { useReducer, useEffect, useRef, useCallback } from 'react'
import type { Mode, Question, GameResult, GameType, Operation } from '../types'
import { generate } from '../lib/game/questionGenerator'
import { generateOps } from '../lib/game/opsQuestionGenerator'
import { generateDivGraphic } from '../lib/game/divGraphicGenerator'
import { calcPoints, getResultsTitleKey } from '../lib/game/scoring'
import { MODE_SECONDS, STORAGE_KEYS } from '../lib/game/constants'
import { saveErrorStat, getErrorStats } from '../lib/storage/errorStats'
import { saveScore } from '../lib/storage/scores'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export type GamePhase =
  | 'idle'       // not yet started
  | 'answering'  // waiting for the user's answer
  | 'feedback'   // showing correct/wrong feedback briefly
  | 'finished'   // round complete

export interface FeedbackInfo {
  correct: boolean
  message: string
  pointsAwarded: number
}

interface GameState {
  phase: GamePhase
  gameType: GameType
  divLevel: 1 | null
  divAid: boolean
  mode: Mode
  tables: number[]
  questions: Question[]
  questionIndex: number
  score: number
  correct: number
  wrong: number
  streak: number
  bestStreak: number
  timeLeft: number | null
  feedback: FeedbackInfo | null
  result: GameResult | null
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: 'START'; gameType: GameType; divLevel: 1 | null; divAid: boolean; tables: number[]; mode: Mode; questions: Question[] }
  | { type: 'SUBMIT_CORRECT'; points: number; feedback: FeedbackInfo }
  | { type: 'SUBMIT_WRONG'; feedback: FeedbackInfo }
  | { type: 'TIMEOUT'; feedback: FeedbackInfo }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH'; result: GameResult }
  | { type: 'TICK' }
  | { type: 'QUIT' }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE: GameState = {
  phase: 'idle',
  gameType: 'mult',
  divLevel: null,
  divAid: false,
  mode: 'free',
  tables: [],
  questions: [],
  questionIndex: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  timeLeft: null,
  feedback: null,
  result: null,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...INITIAL_STATE,
        phase: 'answering',
        gameType: action.gameType,
        divLevel: action.divLevel,
        divAid: action.divAid,
        mode: action.mode,
        tables: action.tables,
        questions: action.questions,
        questionIndex: 0,
        timeLeft: MODE_SECONDS[action.mode],
      }

    case 'SUBMIT_CORRECT': {
      const newStreak = state.streak + 1
      const newScore = state.score + action.points
      return {
        ...state,
        phase: 'feedback',
        score: newScore,
        correct: state.correct + 1,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        timeLeft: null,
        feedback: action.feedback,
      }
    }

    case 'SUBMIT_WRONG':
    case 'TIMEOUT':
      return {
        ...state,
        phase: 'feedback',
        wrong: state.wrong + 1,
        streak: 0,
        timeLeft: null,
        feedback: action.feedback,
      }

    case 'NEXT_QUESTION': {
      const nextIndex = state.questionIndex + 1
      return {
        ...state,
        phase: 'answering',
        questionIndex: nextIndex,
        timeLeft: MODE_SECONDS[state.mode],
        feedback: null,
      }
    }

    case 'FINISH':
      return { ...state, phase: 'finished', result: action.result }

    case 'TICK':
      if (state.timeLeft === null || state.timeLeft <= 0) return state
      return { ...state, timeLeft: state.timeLeft - 1 }

    case 'QUIT':
      return INITIAL_STATE

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const TOTAL_QUESTIONS = 20
const FEEDBACK_CORRECT_DELAY = 600
const FEEDBACK_WRONG_DELAY = 1500

export type StartConfig =
  | { type: 'mult'; tables: number[]; mode: Mode }
  | { type: 'ops'; operations: Operation[]; mode: Mode; divAid?: boolean; tables?: number[] }
  | { type: 'divg'; mode: Mode }

export function useGame(playerName: string, praise: string[]) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // divg reuses the ops stores so ÷ facts are aggregated together in the report
  const isOpsLike = state.gameType === 'ops' || state.gameType === 'divg'
  const errKey   = isOpsLike ? STORAGE_KEYS.opsErrors : STORAGE_KEYS.errors
  const scoreKey = isOpsLike ? STORAGE_KEYS.opsScores : STORAGE_KEYS.scores

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'answering' || state.timeLeft === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.phase, state.timeLeft])

  // ── Handle timeout (timeLeft reaches 0) ───────────────────────────────
  useEffect(() => {
    if (state.phase !== 'answering' || state.timeLeft !== 0) return
    const q = state.questions[state.questionIndex]
    if (!q) return
    saveErrorStat(playerName, q.key, false, errKey)
    dispatch({
      type: 'TIMEOUT',
      feedback: {
        correct: false,
        message: `${q.a} ${q.operation} ${q.b} = ${q.answer}`,
        pointsAwarded: 0,
      },
    })
  }, [state.timeLeft, state.phase, state.questionIndex, state.questions, playerName, errKey])

  // ── Auto-advance after feedback ────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'feedback') return
    const delay = state.feedback?.correct ? FEEDBACK_CORRECT_DELAY : FEEDBACK_WRONG_DELAY
    const id = setTimeout(() => {
      const nextIndex = state.questionIndex + 1
      if (nextIndex >= TOTAL_QUESTIONS) {
        const isRecord = saveScore(
          playerName,
          state.score,
          state.correct,
          state.wrong,
          state.bestStreak,
          state.tables,
          state.mode,
          scoreKey,
        )
        dispatch({
          type: 'FINISH',
          result: {
            score: state.score,
            correct: state.correct,
            wrong: state.wrong,
            bestStreak: state.bestStreak,
            isNewRecord: isRecord,
            mode: state.mode,
          },
        })
      } else {
        dispatch({ type: 'NEXT_QUESTION' })
      }
    }, delay)
    return () => clearTimeout(id)
  }, [
    state.phase,
    state.feedback,
    state.questionIndex,
    state.score,
    state.correct,
    state.wrong,
    state.bestStreak,
    state.tables,
    state.mode,
    playerName,
    scoreKey,
  ])

  // ── Public API ─────────────────────────────────────────────────────────

  const start = useCallback(
    (config: StartConfig) => {
      const isOpsLike = config.type === 'ops' || config.type === 'divg'
      const userStats = isOpsLike
        ? getErrorStats(playerName, STORAGE_KEYS.opsErrors)
        : getErrorStats(playerName)

      let questions: Question[]

      if (config.type === 'divg') {
        questions = generateDivGraphic(userStats)
      } else if (config.type === 'ops') {
        questions = generateOps(config.operations, userStats, Math.random, config.tables)
      } else {
        questions = generate(config.tables, userStats)
      }

      dispatch({
        type: 'START',
        gameType: config.type,
        divLevel: config.type === 'divg' ? 1 : null,
        divAid: config.type === 'ops' ? (config.divAid ?? false) : false,
        tables: config.type === 'mult' ? config.tables : [],
        mode: config.mode,
        questions,
      })
    },
    [playerName],
  )

  const submit = useCallback(
    (value: number) => {
      if (state.phase !== 'answering') return
      const q = state.questions[state.questionIndex]
      if (!q) return
      const correct = value === q.answer
      saveErrorStat(playerName, q.key, correct, errKey)
      if (correct) {
        const points = calcPoints(state.streak, state.mode)
        const p = praise[Math.floor(Math.random() * praise.length)] ?? '🎉'
        dispatch({
          type: 'SUBMIT_CORRECT',
          points,
          feedback: { correct: true, message: `${p} (+${points})`, pointsAwarded: points },
        })
      } else {
        dispatch({
          type: 'SUBMIT_WRONG',
          feedback: {
            correct: false,
            message: `${q.a} ${q.operation} ${q.b} = ${q.answer}`,
            pointsAwarded: 0,
          },
        })
      }
    },
    [state.phase, state.questions, state.questionIndex, state.streak, state.mode, playerName, praise, errKey],
  )

  const submitDivision = useCallback(
    (quotient: number, remainder: number) => {
      if (state.phase !== 'answering') return
      const q = state.questions[state.questionIndex]
      if (!q) return
      const correct = quotient === q.answer && remainder === (q.remainder ?? 0)
      saveErrorStat(playerName, q.key, correct, errKey)
      if (correct) {
        const points = calcPoints(state.streak, state.mode)
        const p = praise[Math.floor(Math.random() * praise.length)] ?? '🎉'
        dispatch({
          type: 'SUBMIT_CORRECT',
          points,
          feedback: { correct: true, message: `${p} (+${points})`, pointsAwarded: points },
        })
      } else {
        dispatch({
          type: 'SUBMIT_WRONG',
          feedback: {
            correct: false,
            message: `${q.a} ÷ ${q.b} = ${q.answer} R ${q.remainder ?? 0}`,
            pointsAwarded: 0,
          },
        })
      }
    },
    [state.phase, state.questions, state.questionIndex, state.streak, state.mode, playerName, praise, errKey],
  )

  const quit = useCallback(() => dispatch({ type: 'QUIT' }), [])

  const currentQuestion = state.questions[state.questionIndex] ?? null
  const progressPct =
    TOTAL_QUESTIONS > 0 ? (state.questionIndex / TOTAL_QUESTIONS) * 100 : 0
  const resultsTitleKey =
    state.result ? getResultsTitleKey(state.result.correct, TOTAL_QUESTIONS) : ''

  return {
    phase: state.phase,
    gameType: state.gameType,
    divLevel: state.divLevel,
    divAid: state.divAid,
    mode: state.mode,
    score: state.score,
    streak: state.streak,
    correct: state.correct,
    wrong: state.wrong,
    bestStreak: state.bestStreak,
    timeLeft: state.timeLeft,
    feedback: state.feedback,
    result: state.result,
    resultsTitleKey,
    currentQuestion,
    questionIndex: state.questionIndex,
    progressPct,
    start,
    submit,
    submitDivision,
    quit,
  }
}
