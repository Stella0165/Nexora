import { useState } from 'react'
import Battle from './components/battle'
import UsernameModal from './components/username'
import LeaderboardModal from './components/leaderboard'
import { submitScore } from './lib/leaderboard'
import './App.css'

const XP_PER_VICTORY = 50
const XP_PER_LEVEL = 100
const MAX_LEVEL = 6

function levelFromXp(xp) {
  return Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1)
}

function xpProgress(xp) {
  return xp % XP_PER_LEVEL
}

function App() {
  const [player, setPlayer] = useState({ username: null, xp: 0 })
  const [screen, setScreen] = useState('home')
  const [lastResult, setLastResult] = useState(null)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  function handleFightClick() {
    if (player.username) {
      setScreen('battle')
    } else {
      setShowUsernameModal(true)
    }
  }

  function handleUsernameSubmit(name) {
    setPlayer((p) => ({ ...p, username: name }))
    setShowUsernameModal(false)
    setScreen('battle')
  }

  function handleBattleEnd(result) {
    setLastResult(result)
    setScreen('home')

    setPlayer((p) => {
      const newXp = result === 'victory' ? p.xp + XP_PER_VICTORY : p.xp
      const newLevel = levelFromXp(newXp)
      submitScore(p.username, newLevel, newXp)
      return { ...p, xp: newXp }
    })
  }

  const level = levelFromXp(player.xp)
  const progress = xpProgress(player.xp)

  if (screen === 'battle') {
    return (
      <div className="app-shell">
        <Battle level={level} bossName="Math Dragon" username={player.username} onBattleEnd={handleBattleEnd} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="home-card" style={{ position: 'relative' }}>
        <button
          className="leaderboard-trigger"
          onClick={() => setShowLeaderboard(true)}
          aria-label="View leaderboard"
          title="Leaderboard"
        >
          🏆
        </button>

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
        <p className="player-greeting">
          {player.username ? `Welcome back, ${player.username}` : 'Enter the arena to begin'}
        </p>

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

        <button className="play-button" onClick={handleFightClick}>
          Fight the Math Dragon
        </button>
      </div>

      {showUsernameModal && (
        <UsernameModal
          onSubmit={handleUsernameSubmit}
          onCancel={() => setShowUsernameModal(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          currentUsername={player.username}
        />
      )}
    </div>
  )
}

export default App