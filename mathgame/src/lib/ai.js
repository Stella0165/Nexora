import { GoogleGenAI } from '@google/genai'
import { LEVEL_CONFIG, MAX_LEVEL, getLevelConfig } from './levelConfig'
import sampleQuestionsByLevel from './sampleQuestions.json'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

const BULK_MODEL = 'gemini-3.1-flash-lite'
const EXPLAIN_MODEL = 'gemini-3.5-flash'

async function callGemini(prompt, model = BULK_MODEL) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.7 }
  })
  return response.text ?? ''
}

export { LEVEL_CONFIG, MAX_LEVEL, getLevelConfig }

export async function generateMathQuestions(level, { count = 10, difficulty = 'medium' } = {}) {
  const config = getLevelConfig(level)

  const exampleByType = {
    matrix: `[ { "question": "[[1,2],[3,4]] + [[5,6],[7,8]] = ?", "answer": [6,8,10,12] } ]`,
    decimal: `[ { "question": "Given points (1,3) (2,5) (3,7), what is y when x=4?", "answer": 9 } ]`,
    integer: `[ { "question": "If you have 24 candies and give away 13, how many are left?", "answer": 11 } ]`
  }

  const wordProblemRule = config.answerType === 'matrix'
    ? `- Write the question as a plain equation using bracket notation (word problems
  don't make sense for matrices), e.g. "[[1,2],[3,4]] + [[5,6],[7,8]] = ?"`
    : `- Always phrase the question as a short English word problem/sentence —
  NEVER a bare equation like "24 - 13 = ?" on its own.
  Good: "If you have 24 candies and give away 13, how many are left?"
  Bad: "24 - 13 = ?"
  Do not append the raw equation after the sentence either — the word
  problem alone is the full question, with no extra "= ?" tacked on.`

  const prompt = `
You are a math tutor creating battle questions for a student math game.
Generate exactly ${count} math questions about "${config.topic}" at ${difficulty} difficulty.

Rules:
${config.instructions}
- Questions should suit a student encountering this topic for the first time
- Make them progressively slightly harder across the list
- Vary the numbers/phrasing/scenario so questions don't repeat
${wordProblemRule}

Respond ONLY with a valid JSON array, no markdown, no explanation, no backticks.
Format exactly like this:
${exampleByType[config.answerType]}
`

  try {
    const raw = await callGemini(prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid shape returned from Gemini')
    }

    return parsed.map((q, i) => ({
      id: i + 1,
      level,
      levelName: config.name,
      question: String(q.question),
      answer: config.answerType === 'matrix' ? q.answer.map(Number) : Number(q.answer),
      answerType: config.answerType,
      source: 'ai'
    }))
  } catch (err) {
    console.error('generateMathQuestions failed:', err)
    throw err
  }
}

export async function generateStepsForQuestion(question) {
  const prompt = `
A student got this math question wrong in a game:
Question: "${question.question}"
Correct answer: ${JSON.stringify(question.answer)}

Write 2-5 short steps (as a JSON array of strings) showing the simplest,
most direct way to reach that answer — the way a student would first learn
it, not a shortcut or mental-math trick. No skipped logic.

Respond ONLY with a valid JSON array of strings, no markdown, no explanation.
Example: ["18 + 19", "Add the numbers", "18 + 19 = 37"]
`

  try {
    const raw = await callGemini(prompt, EXPLAIN_MODEL)
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid steps shape returned from Gemini')
    }

    return parsed.map(String)
  } catch (err) {
    console.error('generateStepsForQuestion failed:', err)
    throw err
  }
}

export function checkAnswer(question, userAnswer) {
  if (question.answerType === 'matrix') {
    if (!Array.isArray(userAnswer) || userAnswer.length !== question.answer.length) return false
    return question.answer.every((v, i) => Number(userAnswer[i]) === v)
  }

  if (question.answerType === 'decimal') {
    const tolerance = 0.01
    return Math.abs(Number(userAnswer) - question.answer) < tolerance
  }

  return Number(userAnswer) === question.answer
}

export async function generateBossLine(bossName, outcome, levelName = '') {
  const prompt = `
You are ${bossName}, a fierce math dragon boss in a children's educational game.
The battle (topic: "${levelName}") just ended with outcome: "${outcome}" (victory = player won, defeat = player lost).

Write ONE short dramatic in-character line (max 20 words) that the dragon says at the end.
- If victory: the dragon is shocked/defeated, speaks with dignity
- If defeat: the dragon is triumphant and menacing, but not scary for kids

Respond with ONLY the dialogue line, no quotes, no explanation.
`

  try {
    const raw = await callGemini(prompt)
    return raw.trim().replace(/^["']|["']$/g, '')
  } catch (err) {
    console.error('generateBossLine failed:', err)
    throw err
  }
}

export function getSampleQuestions(level, count = 10) {
  const pool = sampleQuestionsByLevel[level] || sampleQuestionsByLevel[MAX_LEVEL]
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, Math.min(count, shuffled.length))

  return picked.map((q, i) => ({
    id: i + 1,
    level,
    levelName: getLevelConfig(level).name,
    question: q.question,
    answer: q.answer,
    answerType: q.answerType,
    steps: q.steps,
    source: 'fallback'
  }))
}

export async function generateMathQuestionsSafe(level, options = {}) {
  try {
    return await generateMathQuestions(level, options)
  } catch (err) {
    console.warn(`AI question generation failed for level ${level}, using fallback bank`, err)
    return getSampleQuestions(level, options.count ?? 10)
  }
}