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
        <h2>Enter the Arena</h2>
        <p>What should the dragon call you?</p>

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
            <button type="submit" className="modal-confirm">
              Enter Battle
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}