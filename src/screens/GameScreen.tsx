import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useCoarsePointer } from '../hooks/useCoarsePointer'
import { NumberPad } from '../components/NumberPad'
import { ProgressBar } from '../components/ProgressBar'
import type { useGame } from '../hooks/useGame'
import { TOTAL_QUESTIONS } from '../lib/game/constants'

type GameAPI = ReturnType<typeof useGame>

interface Props {
  game: GameAPI
  onQuit: () => void
}

export function GameScreen({ game, onQuit }: Props) {
  const { tr } = useLanguage()
  const isCoarse  = useCoarsePointer()
  const inputRef  = useRef<HTMLInputElement>(null)
  const cardRef   = useRef<HTMLDivElement>(null)
  const [padValue, setPadValue] = useState('')

  const q        = game.currentQuestion
  const isBusy   = game.phase === 'feedback'
  const isTimed  = game.timeLeft !== null

  // Reset pad and focus input on each new question
  useEffect(() => {
    setPadValue('')
    if (!isCoarse) inputRef.current?.focus()
  }, [game.questionIndex, isCoarse])

  // Flash card on correct answer
  useEffect(() => {
    if (game.feedback?.correct) {
      const el = cardRef.current
      if (!el) return
      el.classList.remove('animate-flashGreen')
      void el.offsetWidth
      el.classList.add('animate-flashGreen')
    }
  }, [game.feedback])

  // Global Enter key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') handleSubmit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function handleSubmit() {
    const val = parseInt(padValue)
    if (isNaN(val)) return
    game.submit(val)
    setPadValue('')
  }

  function handlePadChange(v: string) {
    setPadValue(v)
  }

  if (!q) return null

  // Timer colour
  const timerClass = (() => {
    if (!isTimed || game.timeLeft === null) return 'text-school-orange'
    const pct = game.timeLeft / (parseInt(game.mode) || 1)
    if (pct <= 0.2) return 'text-school-coral animate-pulse-fast'
    if (pct <= 0.5) return 'text-school-orange animate-pulse'
    return 'text-school-orange'
  })()

  const inputClass = [
    'w-[170px] rounded-[16px] border-3 border-b-[5px] bg-school-card2',
    'text-center font-sans text-[2.4em] font-bold text-school-text outline-none',
    'transition-[border-color] duration-200',
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none',
    '[&::-webkit-inner-spin-button]:appearance-none',
    game.feedback?.correct === true
      ? 'border-school-green border-b-school-green-sh bg-[#eafaf1]'
      : game.feedback?.correct === false
        ? 'border-school-coral border-b-school-coral-sh bg-[#fef0ee] animate-shake'
        : 'border-school-blue border-b-school-blue-sh focus:border-school-purple focus:border-b-school-purple-sh',
  ].join(' ')

  return (
    <div>
      {/* Header */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-[13px] bg-school-card px-4 py-2 font-bold shadow-[0_3px_0_#e0d5c8]">
          <span className="text-school-text">{tr.score_label}</span>{' '}
          <span className="text-school-text">{game.score}</span>
        </div>
        <div className="rounded-[13px] bg-school-card px-4 py-2 font-bold text-school-orange shadow-[0_3px_0_#e0d5c8]">
          🔥 {game.streak}
        </div>
        {isTimed && (
          <div className={`rounded-[13px] bg-school-card px-4 py-2 font-bold shadow-[0_3px_0_#e0d5c8] ${timerClass}`}>
            {game.timeLeft}s
          </div>
        )}
      </div>

      {/* Progress */}
      <ProgressBar
        pct={game.progressPct}
        label={tr.question_x_of_y(
          Math.min(game.questionIndex + 1, TOTAL_QUESTIONS),
          TOTAL_QUESTIONS,
        )}
      />

      {/* Question card */}
      <div
        ref={cardRef}
        className="relative mb-3.5 overflow-hidden rounded-[28px] bg-school-card
                   px-5 pb-6 pt-8 text-center shadow-[0_6px_0_#e0d5c8]"
      >
        {/* Question */}
        <div className="mb-5 font-sans text-[3.2em] font-black text-school-text">
          {q.a}{' '}
          <span className="text-school-coral">×</span>{' '}
          {q.b}{' '}
          <span className="text-school-orange">=</span>{' '}
          ?
        </div>

        {/* Answer input — always controlled by padValue so numpad + keyboard share one source */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          readOnly={isCoarse}
          value={padValue}
          className={inputClass}
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            setPadValue(v)
          }}
        />

        {/* Feedback */}
        <div
          className={[
            'mt-3 min-h-[1.5em] text-[1.15em] font-bold',
            game.feedback?.correct === true  ? 'text-school-green' :
            game.feedback?.correct === false ? 'text-school-coral' :
            'text-school-text',
          ].join(' ')}
        >
          {game.feedback?.message ?? ' '}
        </div>

        {/* Number pad */}
        <NumberPad
          value={padValue}
          onChange={handlePadChange}
          onSubmit={handleSubmit}
          disabled={isBusy}
        />
      </div>

      {/* Quit */}
      <button
        onClick={onQuit}
        className="mx-auto block rounded-xl border-2 border-[#ccc] bg-transparent
                   px-6 py-2 font-sans text-[0.93em] font-bold text-school-soft
                   transition-all hover:border-school-coral hover:text-school-coral"
      >
        {tr.btn_quit}
      </button>
    </div>
  )
}
