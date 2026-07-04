import { useState } from 'react'
import './username.css'

export default function UsernameModal({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
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
        <p className="modal-subtitle">What should the dragon call you?</p>

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
          />
          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            {onCancel && (
              <button type="button" onClick={onCancel} className="modal-cancel">
                Cancel
              </button>
            )}
            <button type="submit" className="play-button modal-confirm">
              Enter Battle
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}