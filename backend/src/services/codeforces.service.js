import axios from "axios";

const CF_API_BASE = "https://codeforces.com/api";

// Cache to avoid hammering the API
let cachedProblems = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch all problems from Codeforces API.
 * Caches for 30 minutes to respect rate limits.
 */
export const fetchAllProblems = async () => {
  const now = Date.now();
  if (cachedProblems && now - cacheTimestamp < CACHE_DURATION) {
    return cachedProblems;
  }

  const { data } = await axios.get(`${CF_API_BASE}/problemset.problems`, {
    timeout: 10000,
  });

  if (data.status !== "OK") {
    throw new Error(`Codeforces API error: ${data.comment}`);
  }

  // Build a map of solvedCount by contestId+index
  const statsMap = {};
  for (const stat of data.result.problemStatistics) {
    statsMap[`${stat.contestId}-${stat.index}`] = stat.solvedCount;
  }

  // Filter to only problems with a rating (many unrated ones exist)
  const problems = data.result.problems
    .filter((p) => p.rating && p.type === "PROGRAMMING")
    .map((p) => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags || [],
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      solvedCount: statsMap[`${p.contestId}-${p.index}`] || 0,
    }));

  cachedProblems = problems;
  cacheTimestamp = now;

  console.log(`[codeforces] Fetched ${problems.length} rated problems from Codeforces API`);
  return problems;
};

/**
 * Get random problems filtered by difficulty range.
 * @param {number} minRating - Minimum CF rating (e.g. 800)
 * @param {number} maxRating - Maximum CF rating (e.g. 1200)
 * @param {number} count - Number of problems to return
 * @param {string[]} excludeTags - Tags to exclude (e.g. ["*special", "interactive"])
 */
export const getRandomCFProblems = async (
  minRating = 800,
  maxRating = 1600,
  count = 1,
  excludeTags = ["*special", "interactive"]
) => {
  const allProblems = await fetchAllProblems();

  // Filter by rating range and exclude certain tags
  const filtered = allProblems.filter((p) => {
    if (p.rating < minRating || p.rating > maxRating) return false;
    if (excludeTags.some((tag) => p.tags.includes(tag))) return false;
    return true;
  });

  if (filtered.length === 0) {
    throw new Error(
      `No Codeforces problems found in rating range [${minRating}, ${maxRating}]`
    );
  }

  // Shuffle and pick `count` problems
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Get a single problem by contestId and index.
 */
export const getCFProblemByContest = async (contestId, index) => {
  const allProblems = await fetchAllProblems();
  const found = allProblems.find(
    (p) => p.contestId === contestId && p.index === index
  );
  if (!found) throw new Error(`Problem ${contestId}${index} not found`);
  return found;
};

/**
 * Map game difficulty stages to Codeforces rating ranges.
 * Stage 0 (Easy) → 800-1100
 * Stage 1 (Medium-Easy) → 1100-1400
 * Stage 2 (Medium) → 1400-1700
 * Stage 3 (Medium-Hard) → 1700-2000
 * Stage 4 (Hard) → 2000-2400
 */
export const STAGE_RATING_MAP = [
  { min: 800, max: 1100 },   // Stage 0 — Easy
  { min: 1100, max: 1400 },  // Stage 1 — Medium-Easy
  { min: 1400, max: 1700 },  // Stage 2 — Medium
  { min: 1700, max: 2000 },  // Stage 3 — Medium-Hard
  { min: 2000, max: 2400 },  // Stage 4 — Hard
];

/**
 * Get a problem for a given match stage (0-4).
 */
export const getProblemForStage = async (stage = 0) => {
  const ratingRange = STAGE_RATING_MAP[stage] || STAGE_RATING_MAP[0];
  const problems = await getRandomCFProblems(ratingRange.min, ratingRange.max, 1);
  return problems[0];
};
