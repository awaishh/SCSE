// STUB JUDGE — replace evaluate() with real Judge0 API call when ready

export const SUPPORTED_LANGUAGES = ["javascript", "python", "cpp", "java", "c"];

/**
 * Weighted verdict distribution:
 *   Accepted            60%
 *   Wrong_Answer        20%
 *   Time_Limit_Exceeded 10%
 *   Runtime_Error        7%
 *   Compilation_Error    3%
 */
const VERDICT_WEIGHTS = [
  { verdict: "Accepted", weight: 60 },
  { verdict: "Wrong_Answer", weight: 20 },
  { verdict: "Time_Limit_Exceeded", weight: 10 },
  { verdict: "Runtime_Error", weight: 7 },
  { verdict: "Compilation_Error", weight: 3 },
];

const TOTAL_WEIGHT = VERDICT_WEIGHTS.reduce((sum, v) => sum + v.weight, 0); // 100

/** Return a random integer in [min, max] inclusive */
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick a verdict according to the weighted distribution */
const pickVerdict = () => {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const { verdict, weight } of VERDICT_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return verdict;
  }
  // Fallback (floating-point edge case)
  return "Accepted";
};

/**
 * Simulate code evaluation with realistic latency.
 *
 * @param {string} problemId   - Problem identifier (unused by stub)
 * @param {string} language    - Submission language (unused by stub)
 * @param {string} sourceCode  - Submitted source code (unused by stub)
 * @returns {{ verdict: string, executionTime: number, memory: number }}
 */
export const evaluate = async (problemId, language, sourceCode) => {
  // Simulate judge latency: 500–2000 ms
  const latency = randomInt(500, 2000);
  await new Promise((resolve) => setTimeout(resolve, latency));

  return {
    verdict: pickVerdict(),
    executionTime: randomInt(50, 2000), // ms
    memory: randomInt(1000, 50000),     // KB
  };
};
