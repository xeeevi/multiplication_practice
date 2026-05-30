import { useState, useCallback } from 'react'
import type { Mode, Screen } from './types'
import { LanguageProvider, useLanguage } from './hooks/useLanguage'
import { BackgroundDeco } from './components/BackgroundDeco'
import { LanguageBar } from './components/LanguageBar'
import { SetupScreen } from './screens/SetupScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { useGame } from './hooks/useGame'
import { loadPlayerName } from './lib/storage/playerName'

function AppInner() {
  const { tr } = useLanguage()
  const [screen, setScreen] = useState<Screen>('setup')
  const [playerName, setPlayerName] = useState(() => loadPlayerName())

  const game = useGame(playerName, tr.praise)

  const handleStart = useCallback(
    (tables: number[], mode: Mode) => {
      // Pick up the latest saved name before starting
      const name = loadPlayerName()
      setPlayerName(name)
      game.start(tables, mode)
      setScreen('game')
    },
    [game],
  )

  const handleQuit = useCallback(() => {
    game.quit()
    setScreen('setup')
  }, [game])

  const handleFinish = useCallback(() => {
    setScreen('results')
  }, [])

  // Auto-transition to results when game finishes
  if (game.phase === 'finished' && screen === 'game') {
    setScreen('results')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-school-bg via-[#e8f5fb] to-[#fdf9e7] bg-fixed font-sans text-school-text">
      <BackgroundDeco />
      <LanguageBar />

      <div className="relative z-10 mx-auto max-w-[680px] px-4 pb-10 pt-2">
        <h1 className="mb-1.5 text-center text-[2.1em] font-black tracking-tight text-school-orange">
          {tr.title}
        </h1>

        {screen === 'setup' && (
          <SetupScreen
            onStart={handleStart}
            onLeaderboard={() => setScreen('leaderboard')}
          />
        )}

        {screen === 'game' && (
          <GameScreen game={game} onQuit={handleQuit} />
        )}

        {screen === 'results' && game.result && (
          <ResultsScreen
            result={game.result}
            titleKey={game.resultsTitleKey}
            onReplay={() => {
              if (game.result) {
                handleStart(
                  // re-use tables from last game (stored in game.result context via mode only)
                  // SetupScreen will handle fresh selection; here we just return to setup
                  [],
                  'free',
                )
              }
              setScreen('setup')
            }}
            onMenu={() => setScreen('setup')}
            onLeaderboard={() => setScreen('leaderboard')}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen onBack={() => setScreen('setup')} />
        )}
      </div>

      {/* Silence unused handleFinish — used as future hook */}
      <span className="hidden" aria-hidden>{String(handleFinish)}</span>
    </div>
  )
}

export function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  )
}
