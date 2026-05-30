import { useState } from 'react'
import type { Mode, GameType } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { getScores, clearScores, filterScores } from '../lib/storage/scores'
import { STORAGE_KEYS } from '../lib/game/constants'
import { getAllUserReports, buildUserReport } from '../lib/storage/reportHelper'
import type { UserReport } from '../lib/storage/reportHelper'

interface Props {
  onBack: () => void
  reportEnabled: boolean
}

type LbView = GameType | 'report'
type Filter = Mode | 'all'

const MODE_TABS: { key: Filter; labelKey: string }[] = [
  { key: 'all',  labelKey: 'lb_tab_all'  },
  { key: 'free', labelKey: 'lb_tab_free' },
  { key: '5',    labelKey: 'lb_tab_5'    },
  { key: '10',   labelKey: 'lb_tab_10'   },
  { key: '20',   labelKey: 'lb_tab_20'   },
]

const MEDALS = ['🥇', '🥈', '🥉']

function opColour(op: string): string {
  if (op === '+') return 'text-school-green'
  if (op === '÷') return 'text-school-blue'
  return 'text-school-coral'
}

function errorBadgeCls(rate: number): string {
  if (rate >= 0.7) return 'bg-red-100 text-red-700 border-red-200'
  if (rate >= 0.5) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-yellow-100 text-yellow-700 border-yellow-200'
}

function ReportCard({ report, tr }: { report: UserReport; tr: ReturnType<typeof useLanguage>['tr'] }) {
  const displayName =
    report.userKey === '_default'
      ? '—'
      : report.userKey.charAt(0).toUpperCase() + report.userKey.slice(1)

  return (
    <div className="rounded-[20px] bg-school-card p-5 shadow-[0_4px_0_#e0d5c8]">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[1.1em] font-black text-school-text">{displayName}</h3>
        <span className="text-xs font-bold text-school-soft">
          {tr.report_attempts(report.totalAttempts)}
        </span>
      </div>

      {report.opSummary.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {report.opSummary.map((s) => (
            <span
              key={s.operation}
              className="rounded-lg border bg-school-card2 px-2.5 py-1 text-sm font-bold"
            >
              <span className={opColour(s.operation)}>{s.operation}</span>
              {' '}{Math.round(s.errorRate * 100)}%
            </span>
          ))}
        </div>
      )}

      {report.weakFacts.length > 0 && (
        <>
          <p className="mb-2 text-xs font-bold uppercase text-school-soft">
            {tr.report_weak_title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {report.weakFacts.map((f) => (
              <span
                key={`${f.display}-${f.operation}`}
                className={`rounded-lg border px-2.5 py-1 text-sm font-bold ${errorBadgeCls(f.errorRate)}`}
                title={`${Math.round(f.errorRate * 100)}% error (${f.attempts} intents)`}
              >
                {f.display}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function LeaderboardScreen({ onBack, reportEnabled }: Props) {
  const { tr } = useLanguage()
  const [view, setView]                   = useState<LbView>('mult')
  const [filter, setFilter]               = useState<Filter>('all')
  const [selectedUserKey, setSelectedUser] = useState<string | null>(null)

  const scoreStorageKey = view === 'ops' ? STORAGE_KEYS.opsScores : STORAGE_KEYS.scores
  const [scores, setScores] = useState(() => getScores(scoreStorageKey))

  function switchView(next: LbView) {
    setView(next)
    setFilter('all')
    setSelectedUser(null)
    if (next !== 'report') {
      setScores(getScores(next === 'ops' ? STORAGE_KEYS.opsScores : STORAGE_KEYS.scores))
    }
  }

  function handleClear() {
    if (window.confirm(tr.clear_confirm)) {
      clearScores(scoreStorageKey)
      setScores([])
    }
  }

  function modeLabel(mode: Mode): string {
    return mode === 'free' ? tr.lb_mode_free : tr.lb_mode_timed(mode)
  }

  const visible = filterScores(scores, filter).slice(0, 20)

  const tabBtn = (key: LbView, label: string) => (
    <button
      key={key}
      onClick={() => switchView(key)}
      className={[
        'flex-1 rounded-[14px] border-2 border-b-[4px] py-2.5 font-sans text-[0.82em] font-bold',
        'transition-all touch-manipulation active:translate-y-[3px] active:border-b',
        view === key
          ? 'border-school-blue-sh bg-school-blue text-white'
          : 'border-school-border border-b-[#c8bfb5] bg-school-card text-school-soft hover:border-school-blue hover:text-school-blue',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div>
      <p className="mb-4 text-center text-[1.6em] font-black text-school-text">
        {tr.lb_title}
      </p>

      {/* View tabs */}
      <div className="mb-4 flex gap-2">
        {tabBtn('mult', tr.game_tab_mult)}
        {tabBtn('ops',  tr.game_tab_ops)}
        {reportEnabled && tabBtn('report', tr.lb_tab_report)}
      </div>

      {/* ── Report view ──────────────────────────────────────────────── */}
      {view === 'report' && (() => {
        const reports = getAllUserReports()

        // Level 2 — individual user detail
        if (selectedUserKey !== null) {
          const report = buildUserReport(selectedUserKey)
          return (
            <div className="mb-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="mb-4 flex items-center gap-1 rounded-xl border-2 border-school-border
                           bg-school-card px-4 py-2 text-sm font-bold text-school-soft
                           transition-all hover:border-school-blue hover:text-school-blue"
              >
                {tr.report_back}
              </button>
              {report ? (
                <ReportCard report={report} tr={tr} />
              ) : (
                <p className="py-7 text-center font-bold italic text-school-soft">
                  {tr.report_no_users}
                </p>
              )}
            </div>
          )
        }

        // Level 1 — name list
        return (
          <div className="mb-4">
            {reports.length === 0 ? (
              <div className="rounded-[22px] bg-school-card p-8 text-center shadow-[0_4px_0_#e0d5c8]">
                <p className="font-bold italic text-school-soft">{tr.report_no_users}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reports.map((r) => {
                  const displayName =
                    r.userKey === '_default'
                      ? '—'
                      : r.userKey.charAt(0).toUpperCase() + r.userKey.slice(1)
                  return (
                    <button
                      key={r.userKey}
                      onClick={() => setSelectedUser(r.userKey)}
                      className="flex items-center justify-between rounded-[18px] border-2
                                 border-b-[4px] border-school-border border-b-[#c8bfb5]
                                 bg-school-card px-5 py-4 transition-all touch-manipulation
                                 active:translate-y-[3px] active:border-b
                                 hover:border-school-blue hover:text-school-blue"
                    >
                      <span className="text-[1.1em] font-black text-school-text">
                        {displayName}
                      </span>
                      <span className="text-sm font-bold text-school-soft">
                        {tr.report_attempts(r.totalAttempts)} →
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Scores view (mult / ops) ─────────────────────────────────── */}
      {view !== 'report' && (
        <>
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
                        className="border-b-2 border-school-card2 pb-2 pt-0 text-left
                                   text-[0.82em] font-bold uppercase text-school-soft"
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
                      <tr
                        key={`${s.name}-${s.date}`}
                        className="odd:bg-transparent even:bg-[#fdf7ef]"
                      >
                        <td className={`px-2 py-2.5 text-[0.93em] ${rankCls}`}>
                          {rank <= 3
                            ? <span className="text-[1.25em]">{MEDALS[rank - 1]}</span>
                            : rank}
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
            onClick={handleClear}
            className="mx-auto block rounded-[10px] border border-[#ccc] bg-transparent
                       px-4 py-1.5 font-sans text-[0.82em] font-bold text-school-soft
                       transition-all hover:border-school-coral hover:text-school-coral"
          >
            {tr.lb_clear}
          </button>
        </>
      )}

      <button
        onClick={onBack}
        className="mx-auto mt-4 block rounded-[16px] border-b-[4px] border-b-school-blue-sh
                   bg-school-blue px-9 py-3 font-sans text-[1.02em] font-bold text-white
                   transition-all touch-manipulation hover:brightness-105
                   active:translate-y-[3px] active:border-b"
      >
        {tr.lb_back}
      </button>
    </div>
  )
}
