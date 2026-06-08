import { useState, useEffect } from 'react'
import type { Mode, Operation } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { loadPlayerName, savePlayerName } from '../lib/storage/playerName'
import { getWeakProblems } from '../lib/storage/errorStats'
import type { StartConfig } from '../hooks/useGame'

interface Props {
  onStart: (config: StartConfig) => void
  onLeaderboard: () => void
}

type TopMode = '+' | '-' | '×' | '÷' | 'mixed'

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
  const [topMode, setTopMode]   = useState<TopMode>('+')
  // Shared per-op configs (persist across mode switches)
  const [tables, setTables]     = useState<Set<number>>(new Set(ALL_TABLES))
  const [divLevel, setDivLevel] = useState<1 | 2>(2)
  const [divAid, setDivAid]     = useState(false)
  const [mixedOps, setMixedOps] = useState<Set<Operation>>(new Set(['+', '-', '×', '÷']))
  const [mode, setMode]         = useState<Mode | null>(null)

  useEffect(() => { savePlayerName(name) }, [name])

  // ── Derived ──────────────────────────────────────────────────────────────
  const isDivL1 = topMode === '÷' && divLevel === 1
  const showTimeMode = !isDivL1

  const canStart = (() => {
    if (topMode === '+' || topMode === '-') return mode !== null
    if (topMode === '×') return mode !== null && tables.size > 0
    if (topMode === '÷') return isDivL1 ? true : mode !== null
    // mixed
    return mode !== null && mixedOps.size > 0
  })()

  // ── Table helpers ─────────────────────────────────────────────────────────
  function toggleTable(n: number) {
    setTables(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s })
  }
  function selectAll()  { setTables(new Set(ALL_TABLES)) }
  function selectNone() { setTables(new Set()) }
  function selectHard() { setTables(new Set(HARD_TABLES)) }
  function selectWeak() {
    const weak = getWeakProblems(name)
    if (weak.length === 0) { alert(tr.no_data_alert); return }
    setTables(new Set(weak.map(w => w.a)))
  }

  // ── Mixed op toggle ───────────────────────────────────────────────────────
  function toggleMixedOp(op: Operation) {
    setMixedOps(prev => { const s = new Set(prev); s.has(op) ? s.delete(op) : s.add(op); return s })
  }

  // ── Start ──────────────────────────────────────────────────────────────────
  function handleStart() {
    if (!canStart) return
    const m = mode ?? 'free'

    if (topMode === '+')  return onStart({ type: 'ops', operations: ['+'], mode: m })
    if (topMode === '-')  return onStart({ type: 'ops', operations: ['-'], mode: m })
    if (topMode === '×')  return onStart({ type: 'mult', tables: Array.from(tables), mode: m })
    if (topMode === '÷') {
      if (divLevel === 1) return onStart({ type: 'divg', mode: 'free' })
      return onStart({ type: 'ops', operations: ['÷'], mode: m, divAid })
    }
    // mixed
    onStart({
      type: 'ops',
      operations: Array.from(mixedOps),
      mode: m,
      divAid: mixedOps.has('÷') ? divAid : false,
      tables: mixedOps.has('×') ? Array.from(tables) : undefined,
    })
  }

  // ── Style helpers ──────────────────────────────────────────────────────────
  const btnMode = (selected: boolean) => [
    'rounded-[14px] border-2 border-b-[4px] py-2.5 font-sans text-[0.88em] font-bold',
    'transition-all touch-manipulation active:translate-y-[3px] active:border-b text-center',
    selected
      ? 'border-school-blue-sh bg-school-blue text-white'
      : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-text hover:border-school-blue hover:text-school-blue',
  ].join(' ')

  const btnTime = (selected: boolean) => [
    'rounded-[18px] border-2 border-b-[5px] border-b-[#c8bfb5] bg-school-card py-[17px]',
    'px-2.5 text-center font-bold transition-all touch-manipulation',
    'active:translate-y-1 active:border-b active:border-b-[#c8bfb5]',
    selected
      ? 'bg-school-orange border-school-orange-sh border-b-school-orange-sh text-white'
      : 'border-school-border text-school-text hover:border-school-orange',
  ].join(' ')

  const topModes: { key: TopMode; symbol: string; label: string }[] = [
    { key: '+',     symbol: '+',      label: tr.op_add  },
    { key: '-',     symbol: '−',      label: tr.op_sub  },
    { key: '×',     symbol: '×',      label: tr.op_mult },
    { key: '÷',     symbol: '÷',      label: tr.op_div  },
    { key: 'mixed', symbol: '+−×÷',   label: tr.mode_tab_mixed },
  ]

  return (
    <div>
      {/* Name */}
      <div className="mb-5 rounded-[20px] bg-school-card px-5 py-4 text-center shadow-[0_4px_0_#e0d5c8]">
        <label className="mb-2 block text-sm font-bold text-school-soft">{tr.name_label}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={tr.name_placeholder}
          maxLength={15}
          className="w-56 rounded-xl border-2 border-b-[3px] border-[#ddd] border-b-[#c8bfb5]
                     bg-school-card2 px-5 py-2.5 text-center font-sans text-[1.2em]
                     font-bold text-school-text outline-none
                     focus:border-school-blue focus:border-b-school-blue-sh"
        />
      </div>

      {/* 5-mode strip */}
      <div className="mb-5 grid grid-cols-5 gap-1.5">
        {topModes.map(({ key, symbol, label }) => (
          <button key={key} onClick={() => setTopMode(key)} className={btnMode(topMode === key)}>
            <span className="block text-[1.3em] font-black leading-tight">{symbol}</span>
            <span className="mt-0.5 block text-[0.72em] leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Config panel ───────────────────────────────────────────────────── */}

      {/* Addition */}
      {topMode === '+' && (
        <p className="mb-4 rounded-[14px] bg-school-card px-4 py-3 text-sm font-bold
                      text-school-soft shadow-[0_3px_0_#e0d5c8]">
          {tr.op_add} · {tr.op_add_hint}
        </p>
      )}

      {/* Subtraction */}
      {topMode === '-' && (
        <p className="mb-4 rounded-[14px] bg-school-card px-4 py-3 text-sm font-bold
                      text-school-soft shadow-[0_3px_0_#e0d5c8]">
          {tr.op_sub} · {tr.op_sub_hint}
        </p>
      )}

      {/* Multiplication */}
      {topMode === '×' && (
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
          <div className="mb-4 grid grid-cols-5 gap-2.5">
            {ALL_TABLES.map(n => (
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

      {/* Division */}
      {topMode === '÷' && (
        <>
          <DivConfig divLevel={divLevel} setDivLevel={setDivLevel} tr={tr} />
          {divLevel === 2 && (
            <VisualAidToggle divAid={divAid} setDivAid={setDivAid} tr={tr} />
          )}
        </>
      )}

      {/* Mixed */}
      {topMode === 'mixed' && (
        <>
          <MixedConfig
            mixedOps={mixedOps}
            toggleMixedOp={toggleMixedOp}
            tables={tables}
            tr={tr}
          />
          {mixedOps.has('÷') && (
            <VisualAidToggle divAid={divAid} setDivAid={setDivAid} tr={tr} />
          )}
        </>
      )}

      {/* ── Time mode ──────────────────────────────────────────────────────── */}
      {!showTimeMode ? (
        <p className="mb-6 mt-4 rounded-[14px] bg-school-card px-4 py-3 text-center
                      text-sm font-bold text-school-soft shadow-[0_3px_0_#e0d5c8]">
          ✏️ {tr.mode_free} — {tr.mode_free_sub}
        </p>
      ) : (
        <>
          <p className="mb-3 mt-4 text-[1.15em] font-bold text-school-text">{tr.time_q}</p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            {MODES.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={btnTime(mode === key)}
              >
                <span className="mb-1 block text-[1.65em]">{icon}</span>
                <span>{tr[`mode_${key}` as const]}</span>
                <div className={`mt-1 text-[0.78em] font-bold ${mode === key ? 'text-white/85' : 'text-school-orange'}`}>
                  {tr[`mode_${key}_sub` as const]}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

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

// ---------------------------------------------------------------------------
// Sub-components — Division config
// ---------------------------------------------------------------------------

interface DivConfigProps {
  divLevel: 1 | 2
  setDivLevel: (l: 1 | 2) => void
  tr: ReturnType<typeof import('../hooks/useLanguage').useLanguage>['tr']
}

function DivConfig({ divLevel, setDivLevel, tr }: DivConfigProps) {
  return (
    <div className="mb-4 rounded-[16px] border-2 border-school-blue/30 bg-[#eef6ff] px-4 py-3">
      <p className="mb-2 text-sm font-bold text-school-blue">{tr.div_level_q}</p>
      <div className="flex flex-col gap-2">
        {([
          { lvl: 1 as const, label: tr.div_level1, hint: tr.div_level1_hint },
          { lvl: 2 as const, label: tr.div_level2, hint: tr.div_level2_hint },
        ] as const).map(({ lvl, label, hint }) => (
          <button
            key={lvl}
            onClick={() => setDivLevel(lvl)}
            className={[
              'flex items-start gap-3 rounded-[12px] border-2 border-b-[3px] px-3 py-2.5',
              'text-left transition-all touch-manipulation active:translate-y-0.5',
              divLevel === lvl
                ? 'border-school-blue-sh bg-school-blue text-white'
                : 'border-school-blue/30 border-b-school-blue/40 bg-white text-school-text hover:border-school-blue',
            ].join(' ')}
          >
            <span className={`mt-0.5 text-[1.2em] font-black ${divLevel === lvl ? 'text-white' : 'text-school-blue'}`}>
              {lvl}
            </span>
            <span>
              <span className="block text-[0.92em] font-bold">{label}</span>
              <span className={`text-[0.72em] font-bold ${divLevel === lvl ? 'text-white/80' : 'text-school-soft'}`}>
                {hint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components — Visual aid toggle (shared by ÷ tab and mixed tab)
// ---------------------------------------------------------------------------

interface VisualAidToggleProps {
  divAid: boolean
  setDivAid: (v: boolean | ((prev: boolean) => boolean)) => void
  tr: ReturnType<typeof import('../hooks/useLanguage').useLanguage>['tr']
}

function VisualAidToggle({ divAid, setDivAid, tr }: VisualAidToggleProps) {
  return (
    <button
      onClick={() => setDivAid(prev => !prev)}
      className={[
        'mb-4 flex w-full items-center gap-2 rounded-[14px] border-2 border-b-[3px] px-4 py-3',
        'text-left text-[0.88em] font-bold transition-all touch-manipulation active:translate-y-0.5',
        divAid
          ? 'border-school-orange-sh bg-school-orange text-white'
          : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-soft hover:border-school-orange',
      ].join(' ')}
    >
      <span className="text-[1.3em]">{divAid ? '✓' : '○'}</span>
      {tr.div_visual_aid}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Sub-components — Mixed config
// ---------------------------------------------------------------------------

interface MixedConfigProps {
  mixedOps: Set<Operation>
  toggleMixedOp: (op: Operation) => void
  tables: Set<number>
  tr: ReturnType<typeof import('../hooks/useLanguage').useLanguage>['tr']
}

function MixedConfig({ mixedOps, toggleMixedOp, tables, tr }: MixedConfigProps) {
  const opConfig: Array<{ op: Operation; symbol: string; label: string; note: string }> = [
    { op: '+', symbol: '+', label: tr.op_add,  note: tr.op_add_hint  },
    { op: '-', symbol: '−', label: tr.op_sub,  note: tr.op_sub_hint  },
    { op: '×', symbol: '×', label: tr.op_mult,
      note: tables.size > 0
        ? tables.size === 10
          ? tr.op_mult_hint
          : `${tr.sel_all.toLowerCase()} ${Array.from(tables).sort((a,b)=>a-b).join(',')}`
        : tr.op_mult_hint
    },
    { op: '÷', symbol: '÷', label: tr.op_div, note: tr.op_div_hint },
  ]

  return (
    <div className="mb-4">
      <p className="mb-3 text-[1.15em] font-bold text-school-text">{tr.ops_q}</p>
      <div className="grid grid-cols-2 gap-3">
        {opConfig.map(({ op, symbol, label, note }) => {
          const on = mixedOps.has(op)
          return (
            <button
              key={op}
              onClick={() => toggleMixedOp(op)}
              className={[
                'rounded-[18px] border-2 border-b-[5px] py-4 text-center font-bold',
                'transition-all touch-manipulation active:translate-y-[4px] active:border-b',
                on
                  ? 'border-school-blue-sh bg-school-blue text-white'
                  : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-text hover:border-school-blue',
              ].join(' ')}
            >
              <span className="mb-1 block text-[2em] font-black">{symbol}</span>
              <span className="block text-[0.95em]">{label}</span>
              <span className={`mt-1 block text-[0.7em] font-bold ${on ? 'text-white/80' : 'text-school-soft'}`}>
                {note}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
