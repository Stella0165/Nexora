import { useState } from 'react'
import Battle from './components/battle'
import './App.css'

const XP_PER_VICTORY = 30

function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1
}

function App() {
  const [player, setPlayer] = useState({ username: 'Player', xp: 0 })
  const [screen, setScreen] = useState('home')
  const [lastResult, setLastResult] = useState(null)

  function handleBattleEnd(result) {
    setLastResult(result)
    setScreen('home')

    if (result === 'victory') {
      setPlayer((p) => ({ ...p, xp: p.xp + XP_PER_VICTORY }))
    }
  }

  if (screen === 'battle') {
    return (
      <div className="app-shell">
        <Battle bossName="Math Dragon" onBattleEnd={handleBattleEnd} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="home-card">
        <h1>Nexora</h1>
        <p className="player-greeting">Welcome, {player.username}!</p>
        <p className="player-stats">Level {levelFromXp(player.xp)} &middot; {player.xp} XP</p>

        {lastResult === 'victory' && (
          <p className="result-banner result-banner-win">
            You won your last battle! +{XP_PER_VICTORY} XP
          </p>
        )}
        {lastResult === 'defeat' && (
          <p className="result-banner result-banner-loss">
            You lost your last battle. Try again!
          </p>
        )}

        <button className="play-button" onClick={() => setScreen('battle')}>
          Fight the Math Dragon
        </button>
      </div>
    </div>
  )
}

export default App