import { GoogleGenAI } from '@google/genai'
import { LEVEL_CONFIG, MAX_LEVEL, getLevelConfig } from './levelConfig'
import sampleQuestionsByLevel from './sampleQuestions.json'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { temperature: 0.7 }
})

async function callGemini(prompt) {
  const result = await model.generateContent(prompt)
  return result.response.text() ?? ''
}

export async function generateMathQuestions(level, { count = 10, difficulty = 'medium' } = {}) {
  const config = getLevelConfig(level)

  const exampleByType = {
    matrix: `[ { "question": "[[1,2],[3,4]] + [[5,6],[7,8]] = ?", "answer": [6,8,10,12] } ]`,
    decimal: `[ { "question": "Given points (1,3) (2,5) (3,7), what is y when x=4?", "answer": 9 } ]`,
    integer: `[ { "question": "12 + 7 = ?", "answer": 19 } ]`
  }

  const prompt = `
You are a math tutor creating battle questions for a student math game.
Generate exactly ${count} math questions about "${config.topic}" at ${difficulty} difficulty.

Rules:
${config.instructions}
- Questions should suit a student encountering this topic for the first time
- Make them progressively slightly harder across the list
- Vary the numbers/phrasing so questions don't repeat

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
      answerType: config.answerType
    }))
  } catch (err) {
    console.error('generateMathQuestions failed:', err)
    throw err // caller handles fallback
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

  // integer (default)
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