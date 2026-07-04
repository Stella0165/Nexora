import { useState, useEffect } from 'react'
import { getTopPlayers } from '../lib/leaderboard'
import './leaderboard.css'

export default function LeaderboardModal({ onClose, currentUsername }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    getTopPlayers(10)
      .then((top) => {
        if (!cancelled) setPlayers(top)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-card" onClick={(e) => e.stopPropagation()}>
        <div className="rune-corner rune-corner-tl" />
        <div className="rune-corner rune-corner-tr" />
        <div className="rune-corner rune-corner-bl" />
        <div className="rune-corner rune-corner-br" />

        <button className="leaderboard-close" onClick={onClose} aria-label="Close">
          X
        </button>

        <h2 className="leaderboard-title">Hall of Heroes</h2>
        <p className="leaderboard-subtitle">Top 10 dragon slayers</p>

        {loading && <p className="leaderboard-status">Consulting the ancient scrolls...</p>}
        {!loading && error && <p className="leaderboard-status">Couldn't reach the scrolls right now.</p>}
        {!loading && !error && players.length === 0 && (
          <p className="leaderboard-status">No heroes have entered the arena yet. Be the first!</p>
        )}

        {!loading && !error && players.length > 0 && (
          <ol className="leaderboard-list">
            {players.map((p) => (
              <li
                key={p.username}
                className={`leaderboard-row ${p.username === currentUsername ? 'leaderboard-row-you' : ''}`}
              >
                <span className="leaderboard-rank">#{p.rank}</span>
                <span className="leaderboard-name">{p.username}</span>
                <span className="leaderboard-level">Lv.{p.level}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}