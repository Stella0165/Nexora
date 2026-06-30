import { useState, useRef, useEffect } from 'react'
import { sampleQuestions } from '../data/sampleQuestions'
import { generateMathQuestions, generateBossLine } from '../lib/ai'
import dragonImg from '../assets/dragon.png'
import heroImg from '../assets/hero.png'
import './battle.css'

const BOSS_MAX_HP = 100
const PLAYER_MAX_HP = 100
const DAMAGE_PER_CORRECT = 20
const DAMAGE_PER_WRONG = 15

const FALLBACK_VICTORY_LINES = [
  'No... my flames have failed me. You have bested me, hero.',
  'Impossible! My numbers... they betray me!',
]
const FALLBACK_DEFEAT_LINES = [
  'Your math was no match for my fury!',
  'Another challenger falls before the Math Dragon!',
]

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Battle({ bossName = 'Math Dragon', onBattleEnd }) {
  const [questions, setQuestions] = useState(() => shuffle(sampleQuestions))
  const [questionsSource, setQuestionsSource] = useState('loading') // 'loading' | 'ai' | 'fallback'
  const [questionIndex, setQuestionIndex] = useState(0)
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP)
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [gameOver, setGameOver] = useState(null)
  const [bossAnim, setBossAnim] = useState('')
  const [heroAnim, setHeroAnim] = useState('')
  const [bossLine, setBossLine] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    generateMathQuestions(bossName, { count: 10, difficulty: 'medium' })
      .then((aiQuestions) => {
        if (cancelled) return
        setQuestions(shuffle(aiQuestions))
        setQuestionsSource('ai')
      })
      .catch(() => {
        if (cancelled) return
        setQuestions(shuffle(sampleQuestions))
        setQuestionsSource('fallback')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossName])

  useEffect(() => {
    if (!gameOver) return
    let cancelled = false

    generateBossLine(bossName, gameOver)
      .then((line) => {
        if (!cancelled) setBossLine(line)
      })
      .catch(() => {
        if (!cancelled) {
          setBossLine(
            gameOver === 'victory' ? randomOf(FALLBACK_VICTORY_LINES) : randomOf(FALLBACK_DEFEAT_LINES)
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [gameOver, bossName])

  const currentQuestion = questions[questionIndex % questions.length]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (gameOver || feedback || questionsSource === 'loading') return

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
          <p className="boss-line">{bossLine ?? '\u00A0'}</p>
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
          <p className="boss-line">{bossLine ?? '\u00A0'}</p>
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
          <HpBar hp={bossHp} maxHp={BOSS_MAX_HP} variant="boss" />
        </div>
        <div className={`boss-svg-wrap ${bossAnim}`}>
          <DragonSvg />
        </div>

        <div className="player-hp-card">
          <div className="player-name">You</div>
          <HpRow hp={playerHp} maxHp={PLAYER_MAX_HP} />
          <HpBar hp={playerHp} maxHp={PLAYER_MAX_HP} variant="player" />
        </div>
        <div className={`hero-svg-wrap ${heroAnim}`}>
          <HeroSvg />
        </div>
      </div>

      <div className="question-box">
        {questionsSource === 'loading' ? (
          <p className="question-loading">Summoning a question from the arcane mists...</p>
        ) : (
          <>
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

            {questionsSource === 'fallback' && (
              <p className="ai-status">Running on the backup question bank.</p>
            )}
          </>
        )}
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

function HpBar({ hp, maxHp, variant }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className="hp-bar-outer">
      <div className={`hp-bar-inner hp-bar-${variant}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function DragonSvg() {
  return <img src={dragonImg} alt="Math Dragon" className="dragon-img" />
}

function HeroSvg() {
  return <img src={heroImg} alt="Hero" className="hero-img" />
}