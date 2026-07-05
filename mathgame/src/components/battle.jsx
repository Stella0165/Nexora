import { useState, useRef, useEffect } from 'react'
import { generateMathQuestionsSafe, getSampleQuestions, checkAnswer, getLevelConfig, generateStepsForQuestion } from '../lib/ai'
import { generateBossLine } from '../lib/ai'
import LeaderboardModal from './leaderBoard'
import dragonImg from '../assets/dragon.png'
import heroImg from '../assets/hero.png'
import './battle.css'

const BOSS_MAX_HP = 100
const PLAYER_MAX_HP = 80
const DAMAGE_PER_CORRECT = 25
const DAMAGE_PER_WRONG = 30

const FALLBACK_VICTORY_LINES = [
  'No... my flames have failed me. You have bested me, hero.',
  'Impossible! My numbers... they betray me!',
]
const FALLBACK_DEFEAT_LINES = [
  'Your math was no match for my fury!',
]

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Battle({ level = 1, bossName = 'Math Dragon', username, onBattleEnd }) {
  const [questions, setQuestions] = useState(() => getSampleQuestions(level, 10))
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [questionsSource, setQuestionsSource] = useState('loading')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP)
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [gameOver, setGameOver] = useState(null)
  const [bossAnim, setBossAnim] = useState('')
  const [heroAnim, setHeroAnim] = useState('')
  const [bossLine, setBossLine] = useState(null)
  const [awaitingNext, setAwaitingNext] = useState(false)
  const [missedSteps, setMissedSteps] = useState(null)
  const [stepsLoading, setStepsLoading] = useState(false)
  const inputRef = useRef(null)

  const levelName = getLevelConfig(level).name

  useEffect(() => {
    let cancelled = false
    setQuestionsSource('loading')

    generateMathQuestionsSafe(level, { count: 10, difficulty: 'medium' })
      .then((qs) => {
        if (cancelled) return
        setQuestions(shuffle(qs))
        setQuestionsSource(qs[0]?.source === 'fallback' ? 'fallback' : 'ai')
      })
      .catch(() => {
        if (cancelled) return
        setQuestions(shuffle(getSampleQuestions(level, 10)))
        setQuestionsSource('fallback')
      })

    return () => {
      cancelled = true
    }
  }, [level])

  useEffect(() => {
    if (!gameOver) return
    let cancelled = false

    generateBossLine(bossName, gameOver, levelName)
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
  }, [gameOver, bossName, levelName])

  const currentQuestion = questions[questionIndex % questions.length]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (gameOver || feedback || questionsSource === 'loading') return

    const isCorrect = checkAnswer(currentQuestion, userAnswer)

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
            setTimeout(() => {
              onBattleEnd?.('victory')
            }, 3000)
          }, 500)
        } else {
          setTimeout(() => {
            setFeedback(null)
            setBossAnim('')
            setHeroAnim('')
            setUserAnswer('')
            setQuestionIndex((i) => i + 1)
            inputRef.current?.focus()
          }, 900)
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
            setTimeout(() => {
              onBattleEnd?.('defeat')
            }, 3000)
          }, 500)
        } else {
          setTimeout(() => {
            setBossAnim('')
            setHeroAnim('')
            setAwaitingNext(true)

            if (currentQuestion.steps) {
              setMissedSteps(currentQuestion.steps)
            } else {
              setStepsLoading(true)
              generateStepsForQuestion(currentQuestion)
                .then((steps) => setMissedSteps(steps))
                .catch(() => setMissedSteps(null))
                .finally(() => setStepsLoading(false))
            }
          }, 500)
        }
      }, 250)
    }
  }

  const handleNextQuestion = () => {
    setFeedback(null)
    setUserAnswer('')
    setAwaitingNext(false)
    setMissedSteps(null)
    setStepsLoading(false)
    setQuestionIndex((i) => i + 1)
    inputRef.current?.focus()
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
    <div className="battle-container" style={{ position: 'relative' }}>
      <button
        className="leaderboard-trigger"
        onClick={() => setShowLeaderboard(true)}
        aria-label="View leaderboard"
        title="Leaderboard"
      >
        🏆
      </button>

      <h2 className="battle-title">Level {level}: {levelName} - Boss: {bossName}</h2>

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
        ) : awaitingNext ? (
          <div className="step-review">
            <p className="feedback-wrong">
              You're wrong, the answer is {JSON.stringify(currentQuestion.answer)}.
            </p>

            {stepsLoading ? (
              <p className="steps-unavailable">Working out the steps...</p>
            ) : missedSteps ? (
              <ol className="steps-list">
                {missedSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="steps-unavailable">No step-by-step breakdown available for this one.</p>
            )}

            <button className="attack-button" onClick={handleNextQuestion}>
              Next Question
            </button>
          </div>
        ) : (
          <>
            <p className="question-text">{currentQuestion.question}</p>

            <form onSubmit={handleSubmit} className="answer-form">
              <input
                ref={inputRef}
                type={currentQuestion.answerType === 'matrix' ? 'text' : 'number'}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={currentQuestion.answerType === 'matrix' ? 'e.g. 6,8,10,12' : 'Answer'}
                step={currentQuestion.answerType === 'decimal' ? '0.01' : undefined}
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
              {feedback === 'wrong' && <p className="feedback-wrong">You're wrong, dragon attacks you!</p>}
            </div>

            {questionsSource === 'fallback' && (
              <p className="ai-status">Running on the backup question bank.</p>
            )}
          </>
        )}
      </div>

      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          currentUsername={username}
        />
      )}
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