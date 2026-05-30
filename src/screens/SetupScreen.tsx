import { useState, useEffect } from 'react'
import type { Mode, GameType, Operation } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { loadPlayerName, savePlayerName } from '../lib/storage/playerName'
import { getWeakProblems } from '../lib/storage/errorStats'
import type { StartConfig } from '../hooks/useGame'

interface Props {
  onStart: (config: StartConfig) => void
  onLeaderboard: () => void
}

const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const HARD_TABLES = [6, 7, 8, 9]

const MODES: { key: Mode; icon: string }[] = [
  { key: 'free', icon: '✏️' },
  { key: '5',    icon: '⚡' },
  { key: '10',   icon: '⏰' },
  { key: '20',   icon: '🕐' },
]


export function SetupScreen({ onStart, onLeaderboard }: Props) {
  const { tr } = useLanguage()
  const [name, setName]         = useState(() => loadPlayerName())
  const [gameTab, setGameTab]   = useState<GameType>('mult')
  const [tables, setTables]     = useState<Set<number>>(new Set())
  const [ops, setOps]           = useState<Set<Operation>>(new Set(['×', '+', '-', '÷']))
  const [mode, setMode]         = useState<Mode | null>(null)

  const canStart =
    mode !== null &&
    (gameTab === 'mult' ? tables.size > 0 : ops.size > 0)

  useEffect(() => { savePlayerName(name) }, [name])

  // ── Mult helpers ────────────────────────────────────────────────────────
  function toggleTable(n: number) {
    setTables((prev) => {
      const next = new Set(prev)
      if (next.has(n)) { next.delete(n) } else { next.add(n) }
      return next
    })
  }
  function selectAll()  { setTables(new Set(ALL_TABLES)) }
  function selectNone() { setTables(new Set()) }
  function selectHard() { setTables(new Set(HARD_TABLES)) }
  function selectWeak() {
    const weak = getWeakProblems(name)
    if (weak.length === 0) { alert(tr.no_data_alert); return }
    setTables(new Set(weak.map((w) => w.a)))
  }

  // ── Ops helpers ─────────────────────────────────────────────────────────
  function toggleOp(op: Operation) {
    setOps((prev) => {
      const next = new Set(prev)
      if (next.has(op)) { next.delete(op) } else { next.add(op) }
      return next
    })
  }

  function handleStart() {
    if (!canStart) return
    if (gameTab === 'mult') {
      onStart({ type: 'mult', tables: Array.from(tables), mode: mode! })
    } else {
      onStart({ type: 'ops', operations: Array.from(ops), mode: mode! })
    }
  }

  const btnBase =
    'rounded-[18px] border-2 border-b-[5px] border-b-[#c8bfb5] bg-school-card py-[17px] ' +
    'px-2.5 text-center font-bold transition-all touch-manipulation ' +
    'active:translate-y-1 active:border-b active:border-b-[#c8bfb5]'
  const btnSelected  = 'bg-school-orange border-school-orange-sh border-b-school-orange-sh text-white'
  const btnUnselected = 'border-school-border text-school-text hover:border-school-orange'

  const opConfig: Array<{ op: Operation; label: string; hint: string; symbol: string }> = [
    { op: '×', label: tr.op_mult, hint: tr.op_mult_hint, symbol: '×' },
    { op: '+', label: tr.op_add,  hint: tr.op_add_hint,  symbol: '+' },
    { op: '-', label: tr.op_sub,  hint: tr.op_sub_hint,  symbol: '−' },
    { op: '÷', label: tr.op_div,  hint: tr.op_div_hint,  symbol: '÷' },
  ]

  return (
    <div>
      {/* Name input */}
      <div className="mb-5 rounded-[20px] bg-school-card px-5 py-4 text-center shadow-[0_4px_0_#e0d5c8]">
        <label className="mb-2 block text-sm font-bold text-school-soft">{tr.name_label}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tr.name_placeholder}
          maxLength={15}
          className="w-56 rounded-xl border-2 border-b-[3px] border-[#ddd] border-b-[#c8bfb5]
                     bg-school-card2 px-5 py-2.5 text-center font-sans text-[1.2em]
                     font-bold text-school-text outline-none
                     focus:border-school-blue focus:border-b-school-blue-sh"
        />
      </div>

      {/* Game-type tab switcher */}
      <div className="mb-5 flex gap-2">
        {([
          { key: 'mult' as GameType, label: tr.game_tab_mult },
          { key: 'ops'  as GameType, label: tr.game_tab_ops  },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setGameTab(key)}
            className={[
              'flex-1 rounded-[14px] border-2 border-b-[4px] py-3 font-sans text-[0.95em] font-bold',
              'transition-all touch-manipulation active:translate-y-[3px] active:border-b',
              gameTab === key
                ? 'border-school-blue-sh bg-school-blue text-white'
                : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-soft hover:border-school-blue hover:text-school-blue',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Multiplication tab ─────────────────────────────────────────── */}
      {gameTab === 'mult' && (
        <>
          <p className="mb-3 text-[1.15em] font-bold text-school-text">{tr.tables_q}</p>
          <div className="mb-[18px] flex flex-wrap justify-center gap-2">
            {[
              { label: tr.sel_all,  fn: selectAll  },
              { label: tr.sel_none, fn: selectNone },
              { label: tr.sel_hard, fn: selectHard },
              { label: tr.sel_weak, fn: selectWeak },
            ].map(({ label, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="rounded-full border-2 border-b-[3px] border-school-border border-b-[#c8bfb5]
                           bg-school-card px-4 py-1.5 text-sm font-bold text-school-soft
                           transition-all touch-manipulation active:translate-y-0.5
                           hover:border-school-purple hover:text-school-purple"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-2.5 grid grid-cols-5 gap-2.5">
            {ALL_TABLES.map((n) => (
              <button
                key={n}
                onClick={() => toggleTable(n)}
                className={[
                  'rounded-[14px] border-2 border-b-[4px] py-3.5 font-sans text-[1.45em] font-black',
                  'transition-all touch-manipulation active:translate-y-[3px] active:border-b',
                  tables.has(n)
                    ? 'border-school-blue-sh bg-school-blue text-white'
                    : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-text hover:border-school-blue hover:text-school-blue',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Operations tab ─────────────────────────────────────────────── */}
      {gameTab === 'ops' && (
        <>
          <p className="mb-3 text-[1.15em] font-bold text-school-text">{tr.ops_q}</p>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {opConfig.map(({ op, label, hint, symbol }) => (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                className={[
                  'rounded-[18px] border-2 border-b-[5px] py-5 text-center font-bold',
                  'transition-all touch-manipulation active:translate-y-[4px] active:border-b',
                  ops.has(op)
                    ? 'border-school-blue-sh bg-school-blue text-white'
                    : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-text hover:border-school-blue',
                ].join(' ')}
              >
                <span className="mb-1 block text-[2em] font-black">{symbol}</span>
                <span className="block text-[0.95em]">{label}</span>
                <span className={`mt-1 block text-[0.72em] font-bold ${ops.has(op) ? 'text-white/80' : 'text-school-soft'}`}>
                  {hint}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Shared: mode + start ───────────────────────────────────────── */}
      <p className="mb-3 mt-4 text-[1.15em] font-bold text-school-text">{tr.time_q}</p>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {MODES.map(({ key, icon }) => {
          const labelKey = `mode_${key}` as const
          const subKey   = `mode_${key}_sub` as const
          return (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={[btnBase, mode === key ? btnSelected : btnUnselected].join(' ')}
            >
              <span className="mb-1 block text-[1.65em]">{icon}</span>
              <span>{tr[labelKey]}</span>
              <div className={`mt-1 text-[0.78em] font-bold ${mode === key ? 'text-white/85' : 'text-school-orange'}`}>
                {tr[subKey]}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className="mb-0 mt-1 block w-full rounded-[20px] border-b-[6px] border-b-school-green-sh
                   bg-school-green py-[17px] font-sans text-[1.45em] font-black text-white
                   shadow-[0_2px_12px_rgba(39,174,96,0.28)] transition-all touch-manipulation
                   hover:brightness-105 active:translate-y-[5px] active:border-b
                   disabled:cursor-not-allowed disabled:opacity-40"
      >
        {tr.start}
      </button>

      <button
        onClick={onLeaderboard}
        className="mx-auto mt-3.5 block rounded-[14px] border-2 border-b-[3px]
                   border-school-orange border-b-school-orange-sh bg-transparent
                   px-7 py-2.5 font-sans text-[0.98em] font-bold text-school-orange
                   transition-all touch-manipulation active:translate-y-0.5
                   hover:bg-school-orange hover:text-white"
      >
        {tr.leaderboard_nav}
      </button>
    </div>
  )
}
