import { useState, useEffect, useRef } from 'react'
import type { Question } from '../types'
import type { FeedbackInfo } from '../hooks/useGame'
import { useLanguage } from '../hooks/useLanguage'
import { NumberBlocks } from '../components/NumberBlocks'
import { NumberPad } from '../components/NumberPad'

interface Props {
  question: Question
  questionIndex: number
  onSubmit: (quotient: number, remainder: number) => void
  isBusy: boolean
  feedback: FeedbackInfo | null
  showVisual?: boolean
}

export function DivStatic({ question, questionIndex, onSubmit, isBusy, feedback, showVisual = false }: Props) {
  const { tr } = useLanguage()
  const [quotient, setQuotient]   = useState('')
  const [remainder, setRemainder] = useState('')
  const [activeField, setActiveField] = useState<'q' | 'r'>('q')
  const qInputRef = useRef<HTMLInputElement>(null)
  const rInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuotient('')
    setRemainder('')
    setActiveField('q')
    qInputRef.current?.focus()
  }, [questionIndex])

  // Keep real inputs focused when active field changes
  useEffect(() => {
    if (activeField === 'q') qInputRef.current?.focus()
    else rInputRef.current?.focus()
  }, [activeField])

  const padValue = activeField === 'q' ? quotient : remainder

  function handlePadChange(v: string) {
    if (activeField === 'q') setQuotient(v)
    else setRemainder(v)
  }

  function handlePadSubmit() {
    if (isBusy) return
    const q = parseInt(quotient, 10)
    const r = parseInt(remainder, 10)
    if (isNaN(q) || isNaN(r)) return
    onSubmit(q, r)
  }

  // Handle native keyboard input on each field
  function handleKeyboard(field: 'q' | 'r', e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 3)
    if (field === 'q') setQuotient(v)
    else setRemainder(v)
  }

  function handleKeyDown(field: 'q' | 'r', e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      setActiveField(field === 'q' ? 'r' : 'q')
    }
    if (e.key === 'Enter') handlePadSubmit()
  }

  const fbState =
    feedback?.correct === true  ? 'correct' :
    feedback?.correct === false ? 'wrong'   : 'idle'

  function fieldClass(isActive: boolean) {
    return [
      'w-[110px] rounded-[14px] border-2 border-b-[4px] bg-school-card2',
      'text-center font-sans text-[2em] font-bold text-school-text outline-none',
      'transition-[border-color,background-color] duration-200',
      isActive ? 'ring-2 ring-school-purple ring-offset-1' : '',
      fbState === 'correct' ? 'border-school-green  border-b-school-green-sh  bg-[#eafaf1]' :
      fbState === 'wrong'   ? 'border-school-coral  border-b-school-coral-sh  bg-[#fef0ee]' :
      isActive              ? 'border-school-purple border-b-school-purple-sh'               :
                              'border-school-blue   border-b-school-blue-sh',
    ].join(' ')
  }

  const bagCount = Math.min(question.b, 10)

  return (
    <div>
      {/* Visual card: dividend as blocks + bags (only when showVisual) */}
      {showVisual && (
        <div className="mb-4 rounded-[20px] bg-school-card px-4 pb-5 pt-4
                        text-center shadow-[0_5px_0_#e0d5c8]">
          <div className="mb-3 font-sans text-[1.5em] font-black text-school-text">
            {question.a}{' '}
            <span className="text-school-blue">÷</span>{' '}
            {question.b}{' '}
            <span className="text-school-orange">=</span>{' '}
            ?
          </div>
          <div className="mb-4 flex justify-center">
            <NumberBlocks n={question.a} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: bagCount }, (_, i) => (
              <div
                key={i}
                className="flex h-[52px] w-[44px] flex-col items-center justify-end
                           rounded-[10px] border-2 border-dashed border-school-blue
                           bg-[#eef6ff] pb-1 text-[1.4em]"
              >
                🎒
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question text when visual is hidden */}
      {!showVisual && (
        <div className="mb-4 text-center font-sans text-[2em] font-black text-school-text">
          {question.a}{' '}
          <span className="text-school-blue">÷</span>{' '}
          {question.b}{' '}
          <span className="text-school-orange">=</span>{' '}
          ?
        </div>
      )}

      {/* Two answer inputs with Tab-to-advance button for on-screen pad */}
      <div className="mb-2 flex items-end justify-center gap-3">
        <div className="text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-school-soft">
            {tr.div_quotient}
          </p>
          <input
            ref={qInputRef}
            value={quotient}
            onClick={() => setActiveField('q')}
            onFocus={() => setActiveField('q')}
            onChange={(e) => handleKeyboard('q', e)}
            onKeyDown={(e) => handleKeyDown('q', e)}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            className={fieldClass(activeField === 'q')}
          />
        </div>
        <div className="mb-3 text-[1.6em] font-black text-school-text">R</div>
        <div className="text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-school-soft">
            {tr.div_remainder}
          </p>
          <input
            ref={rInputRef}
            value={remainder}
            onClick={() => setActiveField('r')}
            onFocus={() => setActiveField('r')}
            onChange={(e) => handleKeyboard('r', e)}
            onKeyDown={(e) => handleKeyDown('r', e)}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            className={fieldClass(activeField === 'r')}
          />
        </div>
      </div>

      {/* Feedback line */}
      <div
        className={[
          'mb-1 min-h-[1.5em] text-center text-[1.1em] font-bold',
          feedback?.correct === true  ? 'text-school-green' :
          feedback?.correct === false ? 'text-school-coral' : 'text-transparent',
        ].join(' ')}
      >
        {feedback?.message ?? ' '}
      </div>

      {/* Tab-to-next-field button (on-screen pad users) */}
      <div className="mx-auto mb-2 max-w-[270px]">
        <button
          onClick={() => setActiveField(activeField === 'q' ? 'r' : 'q')}
          disabled={isBusy}
          className="w-full rounded-[13px] border-2 border-b-[3px] border-school-blue/40
                     bg-school-card py-2.5 font-sans text-[0.9em] font-bold text-school-blue
                     transition-all touch-manipulation active:translate-y-0.5
                     disabled:pointer-events-none disabled:opacity-40"
        >
          {activeField === 'q' ? `→ ${tr.div_remainder}` : `← ${tr.div_quotient}`}
        </button>
      </div>

      {/* Number pad — writes to active field */}
      <NumberPad
        value={padValue}
        onChange={handlePadChange}
        onSubmit={handlePadSubmit}
        disabled={isBusy}
      />
    </div>
  )
}
