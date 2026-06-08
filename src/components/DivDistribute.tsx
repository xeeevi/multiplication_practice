import { useState, useRef, useEffect } from 'react'
import type { Question } from '../types'
import type { FeedbackInfo } from '../hooks/useGame'
import { useLanguage } from '../hooks/useLanguage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ItemKind = 'bar' | 'cross'
interface DivItem { id: string; kind: ItemKind }

interface DivStateShape {
  pool: DivItem[]
  bags: DivItem[][]
}

interface DragState {
  item: DivItem
  from: 'pool' | number
  startX: number
  startY: number
  isDragging: boolean
}

interface Props {
  question: Question
  questionIndex: number
  onSubmit: (quotient: number, remainder: number) => void
  isBusy: boolean
  feedback: FeedbackInfo | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0
function uid() { return `item-${++idCounter}` }

function initDivState(dividend: number, divisor: number): DivStateShape {
  const pool: DivItem[] = []
  for (let i = 0; i < Math.floor(dividend / 10); i++) pool.push({ id: uid(), kind: 'bar' })
  for (let i = 0; i < dividend % 10; i++) pool.push({ id: uid(), kind: 'cross' })
  return { pool, bags: Array.from({ length: divisor }, () => []) }
}

function groupValue(items: DivItem[]) {
  return items.reduce((s, it) => s + (it.kind === 'bar' ? 10 : 1), 0)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DivDistribute({ question, questionIndex, onSubmit, isBusy, feedback }: Props) {
  const { tr } = useLanguage()
  const [divState, setDivState] = useState<DivStateShape>(() =>
    initDivState(question.a, question.b),
  )
  const [ghost, setGhost] = useState<{ item: DivItem; x: number; y: number } | null>(null)
  const [localMsg, setLocalMsg] = useState('')

  const dragRef = useRef<DragState | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset state when a new question arrives
  useEffect(() => {
    setDivState(initDivState(question.a, question.b))
    setGhost(null)
    setLocalMsg('')
    dragRef.current = null
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
  }, [questionIndex, question.a, question.b])

  const { pool, bags } = divState
  const bagValues = bags.map(groupValue)
  const poolValue = groupValue(pool)
  const allBagsEqual = bagValues.length > 0 && bagValues.every(v => v === bagValues[0])

  // ---------------------------------------------------------------------------
  // Mutation helpers (pure state transforms)
  // ---------------------------------------------------------------------------

  function composeBar() {
    setDivState(prev => {
      const crossIndices: number[] = []
      for (let i = prev.pool.length - 1; i >= 0 && crossIndices.length < 10; i--) {
        if (prev.pool[i]!.kind === 'cross') crossIndices.push(i)
      }
      if (crossIndices.length < 10) return prev
      const newPool = [...prev.pool]
      for (const idx of crossIndices) newPool.splice(idx, 1)
      newPool.push({ id: uid(), kind: 'bar' })
      return { pool: newPool, bags: prev.bags.map(b => [...b]) }
    })
    setLocalMsg('')
  }

  function breakBar(item: DivItem, from: 'pool' | number) {
    setDivState(prev => {
      const newPool = [...prev.pool]
      const newBags = prev.bags.map(b => [...b])
      const tenCrosses: DivItem[] = Array.from({ length: 10 }, () => ({ id: uid(), kind: 'cross' }))
      if (from === 'pool') {
        const idx = newPool.findIndex(i => i.id === item.id)
        if (idx === -1) return prev
        newPool.splice(idx, 1, ...tenCrosses)
      } else {
        const bag = newBags[from as number]!
        const idx = bag.findIndex(i => i.id === item.id)
        if (idx === -1) return prev
        bag.splice(idx, 1, ...tenCrosses)
      }
      return { pool: newPool, bags: newBags }
    })
    setLocalMsg('')
  }

  function moveItem(item: DivItem, from: 'pool' | number, to: 'pool' | number) {
    if (from === to) return
    setDivState(prev => {
      const newPool = [...prev.pool]
      const newBags = prev.bags.map(b => [...b])
      if (from === 'pool') {
        const idx = newPool.findIndex(i => i.id === item.id)
        if (idx === -1) return prev
        newPool.splice(idx, 1)
      } else {
        const bag = newBags[from as number]!
        const idx = bag.findIndex(i => i.id === item.id)
        if (idx === -1) return prev
        bag.splice(idx, 1)
      }
      if (to === 'pool') {
        newPool.push(item)
      } else {
        newBags[to as number]!.push(item)
      }
      return { pool: newPool, bags: newBags }
    })
    setLocalMsg('')
  }

  // ---------------------------------------------------------------------------
  // Pointer event handlers (attached to container to capture all events)
  // ---------------------------------------------------------------------------

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isBusy) return
    const itemEl = (e.target as HTMLElement).closest('[data-item-id]') as HTMLElement | null
    if (!itemEl) return

    e.preventDefault()
    const item: DivItem = {
      id: itemEl.dataset.itemId!,
      kind: itemEl.dataset.itemKind as ItemKind,
    }
    const fromStr = itemEl.dataset.itemFrom!
    const from: 'pool' | number = fromStr === 'pool' ? 'pool' : parseInt(fromStr, 10)

    dragRef.current = { item, from, startX: e.clientX, startY: e.clientY, isDragging: false }
    e.currentTarget.setPointerCapture(e.pointerId)

    if (item.kind === 'bar') {
      longPressRef.current = setTimeout(() => {
        if (dragRef.current?.item.id === item.id && !dragRef.current.isDragging) {
          dragRef.current = null
          setGhost(null)
          breakBar(item, from)
        }
        longPressRef.current = null
      }, 450)
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const dr = dragRef.current
    const dx = e.clientX - dr.startX
    const dy = e.clientY - dr.startY

    if (!dr.isDragging && Math.sqrt(dx * dx + dy * dy) > 6) {
      if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
      dr.isDragging = true
    }
    if (dr.isDragging) {
      setGhost({ item: dr.item, x: e.clientX, y: e.clientY })
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
    if (!dragRef.current) return
    const was = dragRef.current
    dragRef.current = null
    setGhost(null)
    if (!was.isDragging) return

    // Find drop target by inspecting elements under the pointer
    const els = document.elementsFromPoint(e.clientX, e.clientY)
    let dropTarget: 'pool' | number | null = null
    for (const el of els) {
      const he = el as HTMLElement
      if (he.dataset?.ghost) continue
      const bagIdx = he.dataset?.bagIndex
      if (bagIdx !== undefined) { dropTarget = parseInt(bagIdx, 10); break }
      if (he.dataset?.isPool) { dropTarget = 'pool'; break }
    }
    if (dropTarget !== null) moveItem(was.item, was.from, dropTarget)
  }

  function handlePointerCancel() {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
    dragRef.current = null
    setGhost(null)
  }

  // ---------------------------------------------------------------------------
  // Check / validate
  // ---------------------------------------------------------------------------

  function handleCheck() {
    if (isBusy) return
    if (!allBagsEqual) { setLocalMsg(tr.div_unequal_bags); return }
    const quot = bagValues[0] ?? 0
    if (poolValue > 0 && poolValue >= question.b) { setLocalMsg(tr.div_too_many_left); return }
    setLocalMsg('')
    onSubmit(quot, poolValue)
  }

  const canCheck = !isBusy

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderItem(item: DivItem, from: 'pool' | number) {
    const fromStr = from === 'pool' ? 'pool' : String(from)
    const shared = {
      'data-item-id': item.id,
      'data-item-kind': item.kind,
      'data-item-from': fromStr,
    }
    if (item.kind === 'bar') {
      return (
        <span
          key={item.id}
          {...shared}
          className="inline-block flex-shrink-0 w-[12px] h-[44px] rounded-[3px] bg-school-blue
                     border-2 border-school-blue-sh cursor-grab touch-none select-none"
          title={tr.div_break_bar}
        />
      )
    }
    return (
      <span
        key={item.id}
        {...shared}
        className="inline-flex flex-shrink-0 items-center justify-center
                   text-[26px] text-school-orange font-black leading-none
                   cursor-grab touch-none select-none w-6 h-6"
        aria-hidden
      >
        +
      </span>
    )
  }

  function renderBagItem(item: DivItem, from: number) {
    const fromStr = String(from)
    const shared = {
      'data-item-id': item.id,
      'data-item-kind': item.kind,
      'data-item-from': fromStr,
    }
    if (item.kind === 'bar') {
      return (
        <span
          key={item.id}
          {...shared}
          className="inline-block flex-shrink-0 w-[8px] h-[30px] rounded-[2px]
                     bg-school-blue border border-school-blue-sh cursor-grab touch-none select-none"
        />
      )
    }
    return (
      <span
        key={item.id}
        {...shared}
        className="inline-flex flex-shrink-0 items-center justify-center
                   text-[18px] text-school-orange font-black leading-none
                   cursor-grab touch-none select-none w-5 h-5"
        aria-hidden
      >
        +
      </span>
    )
  }

  // Bags: up to 5 per row
  const bagCols = Math.min(question.b, 5)

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="select-none"
    >
      {/* Instruction */}
      <p className="mb-2 text-center text-sm font-bold text-school-soft">
        {tr.div_instruction} · {question.a} ÷ {question.b}
      </p>

      {/* Regroup toolbar */}
      <div className="mb-1.5 flex items-center gap-2">
        <button
          onClick={() => {
            const bar = divState.pool.find(i => i.kind === 'bar')
            if (bar) breakBar(bar, 'pool')
          }}
          disabled={isBusy || !divState.pool.some(i => i.kind === 'bar')}
          className="flex-1 rounded-[11px] border-b-[3px] border-b-[#b8d0f0] bg-[#ddeeff]
                     py-2 text-xs font-bold text-school-blue touch-manipulation
                     transition-all active:translate-y-px active:border-b
                     disabled:pointer-events-none disabled:opacity-35"
        >
          ▌÷10 · {tr.div_break_bar_btn}
        </button>
        <button
          onClick={composeBar}
          disabled={isBusy || divState.pool.filter(i => i.kind === 'cross').length < 10}
          className="flex-1 rounded-[11px] border-b-[3px] border-b-[#f0d0a0] bg-[#fff3dd]
                     py-2 text-xs font-bold text-school-orange touch-manipulation
                     transition-all active:translate-y-px active:border-b
                     disabled:pointer-events-none disabled:opacity-35"
        >
          +×10→▌ · {tr.div_make_bar}
        </button>
      </div>
      <p className="mb-2 text-center text-[0.7em] text-school-soft">{tr.div_regroup_hint}</p>

      {/* Pool */}
      <div
        data-is-pool="true"
        className="mb-4 min-h-[68px] rounded-[16px] bg-school-card px-3 py-2.5
                   shadow-[0_3px_0_#e0d5c8]"
      >
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-school-soft">
          {tr.div_pool_label}: {question.a}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {pool.length > 0
            ? pool.map(item => renderItem(item, 'pool'))
            : <span className="text-sm text-school-soft">{tr.div_pool_empty}</span>
          }
        </div>
      </div>

      {/* Bags */}
      <div
        style={{ gridTemplateColumns: `repeat(${bagCols}, 1fr)` }}
        className="mb-3 grid gap-2"
      >
        {bags.map((bagItems, bi) => (
          <div
            key={bi}
            data-bag-index={bi}
            className={[
              'flex min-h-[72px] flex-col items-center gap-1 rounded-[12px]',
              'border-2 border-dashed px-1.5 py-2',
              bagItems.length > 0
                ? 'border-school-blue bg-[#eef6ff]'
                : 'border-school-border bg-school-card2',
            ].join(' ')}
          >
            <p className="pointer-events-none text-xs font-bold text-school-soft">{bi + 1}</p>
            <div className="flex flex-wrap items-center justify-center gap-0.5">
              {bagItems.map(item => renderBagItem(item, bi))}
            </div>
            {bagItems.length > 0 && (
              <span className="pointer-events-none mt-auto text-xs font-bold text-school-blue">
                {groupValue(bagItems)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Live readout — always visible */}
      <div className="mb-3 rounded-[12px] bg-school-card px-4 py-2 text-center text-sm
                      font-bold text-school-text shadow-[0_2px_0_#e0d5c8]">
        <span className="text-school-soft">{tr.div_quotient}:</span>{' '}
        <span className="text-school-blue text-[1.1em]">
          {allBagsEqual && bagValues[0] !== undefined ? bagValues[0] : '?'}
        </span>
        {'   '}
        <span className="text-school-soft">{tr.div_remainder}:</span>{' '}
        <span className="text-school-orange text-[1.1em]">{poolValue}</span>
      </div>

      {/* Feedback / local validation message */}
      <div
        className={[
          'mb-3 min-h-[1.4em] text-center text-[0.95em] font-bold',
          feedback?.correct === true  ? 'text-school-green'  :
          feedback?.correct === false ? 'text-school-coral'  :
          localMsg                    ? 'text-school-orange' : 'text-transparent',
        ].join(' ')}
      >
        {feedback?.message ?? localMsg ?? ' '}
      </div>

      {/* Check button */}
      <button
        onClick={handleCheck}
        disabled={!canCheck}
        className={[
          'w-full rounded-[15px] border-b-[5px] border-b-school-green-sh',
          'bg-school-green py-4 font-sans text-[1.15em] font-bold text-white',
          'transition-all touch-manipulation active:translate-y-[4px] active:border-b',
          'disabled:pointer-events-none disabled:opacity-40',
        ].join(' ')}
      >
        {tr.check}
      </button>

      {/* Drag ghost — pointer-events:none so elementsFromPoint skips it */}
      {ghost && (
        <div
          data-ghost="true"
          style={{
            position: 'fixed',
            left: ghost.x - (ghost.item.kind === 'bar' ? 6 : 12),
            top:  ghost.y - (ghost.item.kind === 'bar' ? 22 : 12),
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.75,
          }}
        >
          {ghost.item.kind === 'bar' ? (
            <span
              className="block w-[12px] h-[44px] rounded-[3px] bg-school-blue
                         border-2 border-school-blue-sh"
            />
          ) : (
            <span className="block text-[26px] text-school-orange font-black leading-none">
              +
            </span>
          )}
        </div>
      )}
    </div>
  )
}
