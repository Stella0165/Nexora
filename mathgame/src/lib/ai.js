const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Generate math questions ──────────────────────────────────────────────────

export async function generateMathQuestions(topic, { count = 10, difficulty = 'medium' } = {}) {
  const prompt = `
You are a math tutor creating battle questions for a student math game.
Generate exactly ${count} math questions about "${topic}" at ${difficulty} difficulty.

Rules:
- Each answer must be a whole number (integer)
- Questions should be appropriate for primary/secondary school students
- Vary the question types (addition, subtraction, multiplication, division, etc.)
- Make them progressively slightly harder

Respond ONLY with a valid JSON array, no markdown, no explanation, no backticks.
Format exactly like this:
[
  { "question": "12 + 7 = ?", "answer": 19 },
  { "question": "9 x 6 = ?", "answer": 54 }
]
`

  try {
    const raw = await callGemini(prompt)

    // Strip markdown code fences if Gemini adds them anyway
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Validate the shape
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid shape returned from Gemini')
    }

    return parsed.map((q, i) => ({
      id: i + 1,
      question: String(q.question),
      answer: Number(q.answer)
    }))
  } catch (err) {
    console.error('generateMathQuestions failed:', err)
    throw err // caller handles fallback
  }
}

// ── Generate boss battle dialogue line ───────────────────────────────────────

export async function generateBossLine(bossName, outcome) {
  const prompt = `
You are ${bossName}, a fierce math dragon boss in a children's educational game.
The battle just ended with outcome: "${outcome}" (victory = player won, defeat = player lost).

Write ONE short dramatic in-character line (max 20 words) that the dragon says at the end.
- If victory: the dragon is shocked/defeated, speaks with dignity
- If defeat: the dragon is triumphant and menacing, but not scary for kids

Respond with ONLY the dialogue line, no quotes, no explanation.
`

  try {
    const raw = await callGemini(prompt)
    return raw.trim().replace(/^["']|["']$/g, '') // strip surrounding quotes if any
  } catch (err) {
    console.error('generateBossLine failed:', err)
    throw err // caller handles fallback
  }
}