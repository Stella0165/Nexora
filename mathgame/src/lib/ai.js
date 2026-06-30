import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMMA_API_KEY,
});

const MODEL =
  import.meta.env.VITE_GEMMA_MODEL || "gemma-3-27b-it";

async function callAi(
  prompt,
  { temperature = 0.8, maxOutputTokens = 600 } = {}
) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature,
      maxOutputTokens,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemma returned an empty response");
  }

  return text;
}

export async function generateMathQuestions(bossName, { count = 8, difficulty = "medium" } = {}) {
  const prompt = `Generate ${count} math battle questions for ${bossName}. Return JSON array only. Difficulty: ${difficulty}.`;

  const text = await callAi(prompt);

  const cleaned = text.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}

export async function generateBossLine(bossName, result) {
  const prompt =
    result === "victory"
      ? `Boss ${bossName} lost. Give short defeat line.`
      : `Boss ${bossName} won. Give short taunt line.`;

  const text = await callAi(prompt);

  return text.trim();
}