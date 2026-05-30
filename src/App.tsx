import { useState, useCallback } from 'react'
import type { Screen } from './types'

// Read once on load — never changes during a session.
// Teachers share the URL with ?report=on; children use the plain URL.
const reportEnabled = new URLSearchParams(window.location.search).get('report') === 'on'
import { LanguageProvider, useLanguage } from './hooks/useLanguage'
import { BackgroundDeco } from './components/BackgroundDeco'
import { LanguageBar } from './components/LanguageBar'
import { SetupScreen } from './screens/SetupScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { useGame } from './hooks/useGame'
import type { StartConfig } from './hooks/useGame'
import { loadPlayerName } from './lib/storage/playerName'

function AppInner() {
  const { tr } = useLanguage()
  const [screen, setScreen] = useState<Screen>('setup')
  const [playerName, setPlayerName] = useState(() => loadPlayerName())

  const game = useGame(playerName, tr.praise)

  const handleStart = useCallback(
    (config: StartConfig) => {
      const name = loadPlayerName()
      setPlayerName(name)
      game.start(config)
      setScreen('game')
    },
    [game],
  )

  const handleQuit = useCallback(() => {
    game.quit()
    setScreen('setup')
  }, [game])

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
            onReplay={() => setScreen('setup')}
            onMenu={() => setScreen('setup')}
            onLeaderboard={() => setScreen('leaderboard')}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            onBack={() => setScreen('setup')}
            reportEnabled={reportEnabled}
          />
        )}
      </div>
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
