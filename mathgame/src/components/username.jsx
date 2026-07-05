import { useState } from 'react'
import { checkUsernameExists } from '../lib/leaderboard'
import './username.css'

export default function UsernameModal({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setError('Enter a name before you fight!')
      return
    }
    if (trimmed.length > 20) {
      setError('Keep it under 20 characters.')
      return
    }

    setChecking(true)
    const taken = await checkUsernameExists(trimmed)
    setChecking(false)

    if (taken) {
      setError('That name is already on the leaderboard. Choose another!')
      return
    }

    onSubmit(trimmed)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
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

        <h2 className="modal-title">Enter the Arena</h2>
        <p className="modal-subtitle">What is your name?</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Your hero name"
            autoFocus
            maxLength={20}
            className="modal-input"
            disabled={checking}
          />
          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            {onCancel && (
              <button type="button" onClick={onCancel} className="modal-cancel" disabled={checking}>
                Cancel
              </button>
            )}
            <button type="submit" className="play-button modal-confirm" disabled={checking}>
              {checking ? 'Checking...' : 'Enter Battle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}