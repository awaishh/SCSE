import { Problem } from "../models/problem.model.js";
import { Match } from "../models/match.model.js";
import { ApiError } from "../utils/api-error.js";

/**
 * Get all problems (paginated).
 */
export const getAllProblems = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Problem.find().select("-testCases").sort({ difficultyRating: 1 }).skip(skip).limit(limit),
    Problem.countDocuments(),
  ]);
  return { data, page, limit, total };
};

/**
 * Get a single problem by slug (visible test cases only).
 */
export const getProblemBySlug = async (slug) => {
  const problem = await Problem.findOne({ slug });
  if (!problem) throw new ApiError(404, "Problem not found");
  const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden);
  return { ...problem.toObject(), testCases: visibleTestCases };
};

/**
 * Get a problem with ALL test cases (used by judge internally).
 */
export const getProblemWithAllTestCases = async (problemId) => {
  const problem = await Problem.findById(problemId);
  if (!problem) throw new ApiError(404, "Problem not found");
  return problem;
};

/**
 * Assign 3 random problems for a 1v1 match (one per question slot).
 * Picks randomly from all available problems — no stage range filtering.
 * Persists the assignment so both players always see the same questions.
 */
export const assignMatchProblems = async (matchId) => {
  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Already assigned
  if (match.stageProblemMap && match.stageProblemMap.size >= 3) {
    return match;
  }

  const allProblems = await Problem.find().select("_id").lean();
  if (allProblems.length < 3) {
    throw new ApiError(500, "Not enough problems in the database (need at least 3)");
  }

  // Shuffle and pick 3
  const shuffled = allProblems.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  picked.forEach((p, i) => {
    match.stageProblemMap.set(String(i), p._id);
  });

  await match.save();
  return match;
};

/**
 * Get the assigned problem for a specific question index (0, 1, 2).
 * Returns visible test cases only.
 */
export const getMatchProblem = async (matchId, questionIndex = 0) => {
  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  const problemId = match.stageProblemMap?.get(String(questionIndex));
  if (!problemId) throw new ApiError(404, `No problem assigned for question ${questionIndex}`);

  const problem = await Problem.findById(problemId);
  if (!problem) throw new ApiError(404, "Problem not found");

  const visible = problem.testCases.filter((tc) => !tc.isHidden);
  return { ...problem.toObject(), testCases: visible };
};

// Keep old function for backward compat
export const getOrAssignStageProblemForMatch = async (matchId, stage = 0) => {
  return getMatchProblem(matchId, stage);
};
