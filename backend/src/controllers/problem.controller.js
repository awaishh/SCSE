import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  getRandomCFProblems,
  getCFProblemByContest,
  getProblemForStage,
  fetchAllProblems,
  STAGE_RATING_MAP,
} from "../services/codeforces.service.js";

/**
 * GET /api/problems/codeforces
 * Fetch random Codeforces problems by rating range.
 * Query params: minRating, maxRating, count
 */
export const getCodeforcesProblems = asyncHandler(async (req, res) => {
  const {
    minRating = 800,
    maxRating = 1600,
    count = 5,
  } = req.query;

  const problems = await getRandomCFProblems(
    Number(minRating),
    Number(maxRating),
    Number(count)
  );

  return res.status(200).json(
    new ApiResponse(200, problems, "Codeforces problems fetched")
  );
});

/**
 * GET /api/problems/codeforces/:contestId/:index
 * Fetch a specific Codeforces problem.
 */
export const getCodeforcesProblem = asyncHandler(async (req, res) => {
  const { contestId, index } = req.params;
  const problem = await getCFProblemByContest(Number(contestId), index);
  return res.status(200).json(
    new ApiResponse(200, problem, "Codeforces problem fetched")
  );
});

/**
 * GET /api/problems/codeforces/stage/:stage
 * Fetch a problem appropriate for a given match stage (0-4).
 */
export const getCodeforcesForStage = asyncHandler(async (req, res) => {
  const stage = Number(req.params.stage) || 0;
  const problem = await getProblemForStage(stage);
  return res.status(200).json(
    new ApiResponse(200, { problem, ratingRange: STAGE_RATING_MAP[stage] }, "Stage problem fetched")
  );
});

/**
 * GET /api/problems/codeforces/browse
 * Browse all Codeforces problems with pagination + filtering.
 */
export const browseCodeforces = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    minRating,
    maxRating,
    tag,
  } = req.query;

  let allProblems = await fetchAllProblems();

  // Apply filters
  if (minRating) allProblems = allProblems.filter((p) => p.rating >= Number(minRating));
  if (maxRating) allProblems = allProblems.filter((p) => p.rating <= Number(maxRating));
  if (tag) allProblems = allProblems.filter((p) => p.tags.includes(tag));

  const total = allProblems.length;
  const skip = (Number(page) - 1) * Number(limit);
  const data = allProblems.slice(skip, skip + Number(limit));

  return res.status(200).json(
    new ApiResponse(200, { data, page: Number(page), limit: Number(limit), total }, "Problems browsed")
  );
});
