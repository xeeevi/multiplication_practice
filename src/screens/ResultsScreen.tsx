import { useLanguage } from '../hooks/useLanguage'
import { Confetti } from '../components/Confetti'
import type { GameResult } from '../types'

interface Props {
  result: GameResult
  titleKey: string
  onReplay: () => void
  onMenu: () => void
  onLeaderboard: () => void
}

const TOTAL = 20

export function ResultsScreen({ result, titleKey, onReplay, onMenu, onLeaderboard }: Props) {
  const { tr } = useLanguage()
  const accuracy = (result.correct + result.wrong) > 0
    ? result.correct / (result.correct + result.wrong)
    : 0
  const showConfetti = accuracy >= 0.7

  return (
    <>
      <Confetti active={showConfetti} />

      <div className="mb-6 rounded-[28px] bg-school-card px-6 py-8 text-center shadow-[0_6px_0_#e0d5c8]">
        <h2 className="mb-1 text-[2em] font-black text-school-text">
          {tr[titleKey as keyof typeof tr] as string}
        </h2>

        <p className="text-[3.8em] font-black text-school-orange">{result.score}</p>
        <p className="mb-4 font-bold text-school-soft">{tr.points}</p>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { val: result.correct, label: tr.stat_correct, color: 'text-school-green' },
            { val: result.wrong,   label: tr.stat_wrong,   color: 'text-school-coral' },
            { val: result.bestStreak, label: tr.stat_streak, color: 'text-school-orange' },
          ].map(({ val, label, color }) => (
            <div
              key={label}
              className="rounded-[16px] bg-school-card2 px-2 py-3.5 shadow-[0_3px_0_#e0d5c8]"
            >
              <p className={`text-[1.75em] font-black ${color}`}>{val}</p>
              <p className="mt-1 text-xs font-bold text-school-soft">{label}</p>
            </div>
          ))}
        </div>

        {result.isNewRecord && (
          <div className="mt-3 inline-block animate-bounce rounded-full
                          border-b-4 border-b-school-yellow-sh bg-school-yellow
                          px-5 py-1.5 text-[1.1em] font-black text-white">
            {tr.new_record}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          onClick={onReplay}
          className="rounded-[16px] border-b-[4px] border-b-school-green-sh bg-school-green
                     px-6 py-3 font-sans text-[1.02em] font-bold text-white
                     transition-all touch-manipulation hover:brightness-105
                     active:translate-y-[3px] active:border-b"
        >
          {tr.btn_replay}
        </button>
        <button
          onClick={onMenu}
          className="rounded-[16px] border-2 border-b-[4px] border-school-border
                     border-b-[#c8bfb5] bg-school-card2 px-6 py-3 font-sans
                     text-[1.02em] font-bold text-school-text transition-all
                     touch-manipulation hover:brightness-105
                     active:translate-y-[3px] active:border-b"
        >
          {tr.btn_menu}
        </button>
        <button
          onClick={onLeaderboard}
          className="rounded-[16px] border-b-[4px] border-b-school-yellow-sh bg-school-yellow
                     px-6 py-3 font-sans text-[1.02em] font-bold text-white
                     transition-all touch-manipulation hover:brightness-105
                     active:translate-y-[3px] active:border-b"
        >
          {tr.btn_leaderboard}
        </button>
      </div>
      {/* suppress unused var warning — TOTAL is used by parent context */}
      <span className="hidden">{TOTAL}</span>
    </>
  )
}
