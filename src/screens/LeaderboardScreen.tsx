import { useState } from 'react'
import type { Mode, GameType } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { getScores, clearScores, filterScores } from '../lib/storage/scores'
import { STORAGE_KEYS } from '../lib/game/constants'

interface Props {
  onBack: () => void
}

type Filter = Mode | 'all'

const MODE_TABS: { key: Filter; labelKey: string }[] = [
  { key: 'all',  labelKey: 'lb_tab_all'  },
  { key: 'free', labelKey: 'lb_tab_free' },
  { key: '5',    labelKey: 'lb_tab_5'    },
  { key: '10',   labelKey: 'lb_tab_10'   },
  { key: '20',   labelKey: 'lb_tab_20'   },
]

const MEDALS = ['🥇', '🥈', '🥉']

export function LeaderboardScreen({ onBack }: Props) {
  const { tr } = useLanguage()
  const [gameTab, setGameTab] = useState<GameType>('mult')
  const [filter, setFilter]   = useState<Filter>('all')

  const storageKey = gameTab === 'ops' ? STORAGE_KEYS.opsScores : STORAGE_KEYS.scores
  const [scores, setScores]   = useState(() => getScores(storageKey))

  // Reload scores when game tab or storage key changes
  function switchGameTab(tab: GameType) {
    setGameTab(tab)
    setFilter('all')
    setScores(getScores(tab === 'ops' ? STORAGE_KEYS.opsScores : STORAGE_KEYS.scores))
  }

  function handleClear() {
    if (window.confirm(tr.clear_confirm)) {
      clearScores(storageKey)
      setScores([])
    }
  }

  function modeLabel(mode: Mode): string {
    return mode === 'free' ? tr.lb_mode_free : tr.lb_mode_timed(mode)
  }

  const visible = filterScores(scores, filter).slice(0, 20)

  return (
    <div>
      <p className="mb-4 text-center text-[1.6em] font-black text-school-text">
        {tr.lb_title}
      </p>

      {/* Game-type tabs */}
      <div className="mb-4 flex gap-2">
        {([
          { key: 'mult' as GameType, label: tr.game_tab_mult },
          { key: 'ops'  as GameType, label: tr.game_tab_ops  },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchGameTab(key)}
            className={[
              'flex-1 rounded-[14px] border-2 border-b-[4px] py-2.5 font-sans text-[0.9em] font-bold',
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

      {/* Mode filter tabs */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {MODE_TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'rounded-xl border-2 border-b-[3px] px-4 py-1.5 font-sans text-sm font-bold',
              'transition-all touch-manipulation active:translate-y-0.5 active:border-b',
              filter === key
                ? 'border-school-purple-sh bg-school-purple text-white'
                : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-soft hover:border-school-purple hover:text-school-purple',
            ].join(' ')}
          >
            {tr[labelKey as keyof typeof tr] as string}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mb-4 overflow-x-auto rounded-[22px] bg-school-card p-6 shadow-[0_4px_0_#e0d5c8]">
        {visible.length === 0 ? (
          <p className="py-7 text-center font-bold italic text-school-soft">{tr.lb_empty}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[tr.lb_col_rank, tr.lb_col_name, tr.lb_col_score, tr.lb_col_hits, tr.lb_col_mode].map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-school-card2 pb-2 pt-0 text-left text-[0.82em]
                               font-bold uppercase text-school-soft"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => {
                const rank = i + 1
                const rankCls =
                  rank === 1 ? 'text-[#b7800a] font-black' :
                  rank === 2 ? 'text-[#6e6e6e] font-black' :
                  rank === 3 ? 'text-[#9e5a1f] font-black' : ''
                return (
                  <tr key={`${s.name}-${s.date}`} className="odd:bg-transparent even:bg-[#fdf7ef]">
                    <td className={`px-2 py-2.5 text-[0.93em] ${rankCls}`}>
                      {rank <= 3 ? <span className="text-[1.25em]">{MEDALS[rank - 1]}</span> : rank}
                    </td>
                    <td className="px-2 py-2.5 text-[0.93em] text-school-text">{s.name}</td>
                    <td className={`px-2 py-2.5 text-[0.93em] ${rankCls}`}>{s.score}</td>
                    <td className="px-2 py-2.5 text-[0.93em] text-school-text">
                      {s.correct}/{s.correct + s.wrong}
                    </td>
                    <td className="px-2 py-2.5 text-[0.93em] text-school-text">
                      {modeLabel(s.mode)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <button
        onClick={onBack}
        className="mx-auto block rounded-[16px] border-b-[4px] border-b-school-blue-sh
                   bg-school-blue px-9 py-3 font-sans text-[1.02em] font-bold text-white
                   transition-all touch-manipulation hover:brightness-105
                   active:translate-y-[3px] active:border-b"
      >
        {tr.lb_back}
      </button>

      <button
        onClick={handleClear}
        className="mx-auto mt-3 block rounded-[10px] border border-[#ccc] bg-transparent
                   px-4 py-1.5 font-sans text-[0.82em] font-bold text-school-soft
                   transition-all hover:border-school-coral hover:text-school-coral"
      >
        {tr.lb_clear}
      </button>
    </div>
  )
}
