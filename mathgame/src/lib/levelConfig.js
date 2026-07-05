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
- Numbers should mostly stay within the 1-12 times-table range`
  },
  3: {
    name: 'Linear Regression',
    topic: 'simple linear regression (line of best fit)',
    answerType: 'decimal',
    instructions: `
- Give 3-4 small (x, y) data points that fit a clean linear relationship
  y = mx + b, using an integer or simple one-decimal m and b
- Ask the student to find the slope (m), the intercept (b), or the
  predicted y for a new x, vary which one is asked
- Choose points so the answer is exact, not a statistical estimate
- The "answer" field MUST be a single number, can be decimal (e.g. 2.5)`
  },
  4: {
    name: 'Algebra (Quadratics)',
    topic: 'solving quadratic equations',
    answerType: 'integer',
    instructions: `
- Give quadratic equations that factor cleanly, e.g. "x^2 - 5x + 6 = 0"
- Use integer roots only, keep coefficients small (roots between -10 and 10)
- Ask for ONE specific root each time and always specify which one, e.g.
  "What is the larger root of x^2 - 5x + 6 = 0?" or "the smaller root"
- Never ask for "the roots" (plural), since the answer must be a single number
- The "answer" field MUST be a single integer`
  },
  5: {
    name: 'Probability (Final Boss)',
    topic: 'probability',
    answerType: 'decimal',
    instructions: `
- Cover classic probability scenarios: dice, coins, cards, colored balls in a
  bag, simple combinations/permutations
- Choose numbers so the probability simplifies to a clean value
  (e.g. 0.5, 0.25, 0.2, 0.75), avoid ugly repeating decimals
- Ask the student to express probability as a decimal (not a fraction or %)
- This is the hardest level where questions should require two-step reasoning
  (e.g. "and then" / "given that" / combined events), not single-step lookups
- The "answer" field MUST be a single decimal number between 0 and 1`
  }
}

export const MAX_LEVEL = Math.max(...Object.keys(LEVEL_CONFIG).map(Number))

export function getLevelConfig(level) {
  return LEVEL_CONFIG[level] || LEVEL_CONFIG[MAX_LEVEL]
}