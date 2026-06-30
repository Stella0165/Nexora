import { useState } from 'react'
import Battle from './components/battle'
import './App.css'

const XP_PER_VICTORY = 30
const XP_PER_LEVEL = 100

function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function xpProgress(xp) {
  return xp % XP_PER_LEVEL
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

  const level = levelFromXp(player.xp)
  const progress = xpProgress(player.xp)

  return (
    <div className="app-shell">
      <div className="home-card">
        <div className="rune-corner rune-corner-tl" />
        <div className="rune-corner rune-corner-tr" />
        <div className="rune-corner rune-corner-bl" />
        <div className="rune-corner rune-corner-br" />

        <div className="sigil" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="sigil-svg">
            <polygon points="32,4 58,46 6,46" />
            <circle cx="32" cy="32" r="20" />
          </svg>
        </div>

        <h1 className="game-title">Nexora</h1>
        <p className="player-greeting">Welcome back, {player.username}</p>

        <div className="level-block">
          <div className="level-label-row">
            <span className="level-tag">Level {level}</span>
            <span className="xp-tag">{progress}/{XP_PER_LEVEL} XP</span>
          </div>
          <div className="xp-bar-outer">
            <div className="xp-bar-inner" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {lastResult === 'victory' && (
          <p className="result-banner result-banner-win">
            Victory! You earned +{XP_PER_VICTORY} XP
          </p>
        )}
        {lastResult === 'defeat' && (
          <p className="result-banner result-banner-loss">
            The dragon held its ground. Try again!
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