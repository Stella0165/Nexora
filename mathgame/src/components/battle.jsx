import { useState, useRef } from 'react'
import { sampleQuestions } from '../data/sampleQuestions'
import './battle.css'

const BOSS_MAX_HP = 100
const PLAYER_MAX_HP = 100
const DAMAGE_PER_CORRECT = 20
const DAMAGE_PER_WRONG = 15

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

export default function Battle({ bossName = "Math Dragon", onBattleEnd }) {
  const [questions] = useState(() => shuffle(sampleQuestions))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP)
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [gameOver, setGameOver] = useState(null)
  const [bossAnim, setBossAnim] = useState('')
  const [heroAnim, setHeroAnim] = useState('')
  const inputRef = useRef(null)

  const currentQuestion = questions[questionIndex % questions.length]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (gameOver || feedback) return

    const isCorrect = parseInt(userAnswer, 10) === currentQuestion.answer

    if (isCorrect) {
      setFeedback('correct')
      setHeroAnim('hero-lunge')

      setTimeout(() => {
        const newBossHp = Math.max(0, bossHp - DAMAGE_PER_CORRECT)
        setBossHp(newBossHp)
        setBossAnim('boss-hit flash-red')

        if (newBossHp === 0) {
          setTimeout(() => {
            setGameOver('victory')
            onBattleEnd?.('victory')
          }, 500)
        }
      }, 200)
    } else {
      setFeedback('wrong')
      setBossAnim('boss-lunge')

      setTimeout(() => {
        const newPlayerHp = Math.max(0, playerHp - DAMAGE_PER_WRONG)
        setPlayerHp(newPlayerHp)
        setHeroAnim('hero-hit flash-red')

        if (newPlayerHp === 0) {
          setTimeout(() => {
            setGameOver('defeat')
            onBattleEnd?.('defeat')
          }, 500)
        }
      }, 250)
    }

    setTimeout(() => {
      setFeedback(null)
      setBossAnim('')
      setHeroAnim('')
      setUserAnswer('')
      setQuestionIndex((i) => i + 1)
      inputRef.current?.focus()
    }, 1100)
  }

  if (gameOver === 'victory') {
    return (
      <div className="battle-container">
        <div className="result-card result-victory">
          <div className="dragon-defeated" style={{ width: 110, height: 110, margin: '0 auto 12px' }}>
            <DragonSvg />
          </div>
          <h2>Victory!</h2>
          <p>You defeated {bossName}!</p>
        </div>
      </div>
    )
  }

  if (gameOver === 'defeat') {
    return (
      <div className="battle-container">
        <div className="result-card result-defeat">
          <h2>Defeated...</h2>
          <p>{bossName} was too strong. Try again!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-container">
      <h2 className="battle-title">Boss battle: {bossName}</h2>

      <div className="arena">
        <div className="hill" />

        <div className="platform boss" />
        <div className="platform player" />

        <div className="boss-hp-card">
          <div className="boss-name">{bossName}</div>
          <HpRow hp={bossHp} maxHp={BOSS_MAX_HP} />
          <HpBar hp={bossHp} maxHp={BOSS_MAX_HP} color="#e74c3c" />
        </div>
        <div className={`boss-svg-wrap ${bossAnim}`}>
          <DragonSvg />
        </div>

        <div className="player-hp-card">
          <div className="player-name">You</div>
          <HpRow hp={playerHp} maxHp={PLAYER_MAX_HP} />
          <HpBar hp={playerHp} maxHp={PLAYER_MAX_HP} color="#2ecc71" />
        </div>
        <div className={`hero-svg-wrap ${heroAnim}`}>
          <HeroSvg />
        </div>
      </div>

      <div className="question-box">
        <p className="question-text">{currentQuestion.question}</p>

        <form onSubmit={handleSubmit} className="answer-form">
          <input
            ref={inputRef}
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Answer"
            className="answer-input"
            autoFocus
            disabled={feedback !== null}
          />
          <button type="submit" className="attack-button" disabled={feedback !== null}>
            Attack!
          </button>
        </form>

        <div className="feedback-slot">
          {feedback === 'correct' && <p className="feedback-correct">Correct! You strike the boss!</p>}
          {feedback === 'wrong' && (
            <p className="feedback-wrong">
              You got it wrong, the answer was {currentQuestion.answer}. The boss attacks!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function HpRow({ hp, maxHp }) {
  return (
    <div className="hp-label-row">
      <span>HP</span>
      <span>{hp}/{maxHp}</span>
    </div>
  )
}

function HpBar({ hp, maxHp, color }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className="hp-bar-outer">
      <div className="hp-bar-inner" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function DragonSvg() {
  return (
    <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="170" rx="65" ry="9" fill="rgba(0,0,0,0.15)" />
      <path d="M35 130 Q8 122 12 95 Q16 110 42 113 Z" fill="#5b8c3a" />
      <path d="M165 130 Q192 122 188 95 Q184 110 158 113 Z" fill="#5b8c3a" />
      <ellipse cx="100" cy="115" rx="58" ry="48" fill="#6fae3e" />
      <ellipse cx="100" cy="132" rx="34" ry="26" fill="#bfe592" />
      <path d="M55 85 Q22 50 35 15 Q63 38 68 80 Z" fill="#4f8a2c" />
      <path d="M145 85 Q178 50 165 15 Q137 38 132 80 Z" fill="#4f8a2c" />
      <rect x="68" y="152" width="15" height="22" rx="6" fill="#5b8c3a" />
      <rect x="117" y="152" width="15" height="22" rx="6" fill="#5b8c3a" />
      <circle cx="100" cy="58" r="40" fill="#6fae3e" />
      <path d="M72 32 L64 8 L80 30 Z" fill="#3f6b1f" />
      <path d="M128 32 L136 8 L120 30 Z" fill="#3f6b1f" />
      <circle cx="84" cy="55" r="8" fill="#fff" />
      <circle cx="116" cy="55" r="8" fill="#fff" />
      <circle cx="85" cy="56" r="4" fill="#a01818" />
      <circle cx="115" cy="56" r="4" fill="#a01818" />
      <ellipse cx="100" cy="77" rx="19" ry="13" fill="#bfe592" />
      <circle cx="92" cy="75" r="2" fill="#3f6b1f" />
      <circle cx="108" cy="75" r="2" fill="#3f6b1f" />
      <path d="M88 90 L92 98 L96 90 Z" fill="#fff" />
      <path d="M104 90 L108 98 L112 90 Z" fill="#fff" />
    </svg>
  )
}

function HeroSvg() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="40" ry="7" fill="rgba(0,0,0,0.18)" />
      <rect x="78" y="150" width="16" height="38" rx="6" fill="#2d4a73" />
      <rect x="106" y="150" width="16" height="38" rx="6" fill="#2d4a73" />
      <path d="M62 100 Q100 88 138 100 L132 158 Q100 168 68 158 Z" fill="#d9a818" />
      <rect x="64" y="128" width="72" height="11" fill="#6b3f17" />
      <rect x="40" y="98" width="18" height="55" rx="9" fill="#d9a818" />
      <rect x="142" y="90" width="18" height="60" rx="9" fill="#d9a818" transform="rotate(15 151 120)" />
      <rect x="158" y="50" width="9" height="70" fill="#c8c8c8" transform="rotate(15 162 85)" />
      <rect x="152" y="44" width="20" height="11" fill="#888" transform="rotate(15 162 50)" />
      <circle cx="100" cy="65" r="34" fill="#6b3f17" />
      <path d="M68 60 Q70 30 100 28 Q130 30 132 60 Q120 50 100 48 Q80 50 68 60 Z" fill="#4a2a10" />
    </svg>
  )
}