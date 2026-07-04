import { GoogleGenerativeAI } from '@google/generative-ai'

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

export const LEVEL_CONFIG = {
  1: {
    name: 'Addition & Subtraction',
    topic: 'addition and subtraction',
    answerType: 'integer',
    instructions: `
- Use only addition (+) and subtraction (-)
- Numbers should be between 1 and 50, results should not be negative`
  },
  2: {
    name: 'Multiplication & Division',
    topic: 'multiplication and division',
    answerType: 'integer',
    instructions: `
- Use only multiplication (x) and division (÷)
- Division must always produce a whole number, no remainders
- Numbers should mostly stay within the 1–12 times-table range`
  },
  3: {
    name: 'Matrices',
    topic: '2x2 matrix addition, subtraction, and multiplication',
    answerType: 'matrix',
    instructions: `
- Show two 2x2 matrices in the question text using bracket notation,
  e.g. "[[1,2],[3,4]] + [[5,6],[7,8]] = ?"
- Operation can be matrix addition, subtraction, or multiplication of two 2x2 matrices
- Keep numbers small (0-9) so mental/paper math stays manageable
- The "answer" field MUST be a flat array of 4 numbers representing the
  resulting 2x2 matrix in row-major order, e.g. [6,8,10,12]`
  },
  4: {
    name: 'Linear Regression',
    topic: 'simple linear regression (line of best fit)',
    answerType: 'decimal',
    instructions: `
- Give 3–4 small (x, y) data points that fit a clean linear relationship
  y = mx + b, using an integer or simple one-decimal m and b
- Ask the student to find the slope (m), the intercept (b), or the
  predicted y for a new x — vary which one is asked
- Choose points so the answer is exact, not a statistical estimate
- The "answer" field MUST be a single number, can be decimal (e.g. 2.5)`
  },
  5: {
    name: 'Algebra (Quadratics)',
    topic: 'solving quadratic equations',
    answerType: 'integer',
    instructions: `
- Give quadratic equations that factor cleanly, e.g. "x^2 - 5x + 6 = 0"
- Use integer roots only, keep coefficients small (roots between -10 and 10)
- Ask for ONE specific root each time — always specify which one, e.g.
  "What is the larger root of x^2 - 5x + 6 = 0?" or "the smaller root"
- Never ask for "the roots" (plural), since the answer must be a single number
- The "answer" field MUST be a single integer`
  },
  6: {
    name: 'Probability (Final Boss)',
    topic: 'probability',
    answerType: 'decimal',
    instructions: `
- Cover classic probability scenarios: dice, coins, cards, colored balls in a
  bag, simple combinations/permutations
- Choose numbers so the probability simplifies to a clean value
  (e.g. 0.5, 0.25, 0.2, 0.75), avoid ugly repeating decimals
- Ask the student to express probability as a decimal (not a fraction or %)
- This is the hardest level — questions should require two-step reasoning
  (e.g. "and then" / "given that" / combined events), not single-step lookups
- The "answer" field MUST be a single decimal number between 0 and 1`
  }
}

export const MAX_LEVEL = Math.max(...Object.keys(LEVEL_CONFIG).map(Number)) // currently 6

export function getLevelConfig(level) {
  return LEVEL_CONFIG[level] || LEVEL_CONFIG[MAX_LEVEL]
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