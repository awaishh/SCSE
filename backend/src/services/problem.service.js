import { Problem } from "../models/problem.model.js";
import { Match } from "../models/match.model.js";
import { ApiError } from "../utils/api-error.js";

/**
 * Get all problems (paginated, for admin or browsing).
 */
export const getAllProblems = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Problem.find()
      .select("-testCases")
      .sort({ difficultyRating: 1 })
      .skip(skip)
      .limit(limit),
    Problem.countDocuments(),
  ]);
  return { data, page, limit, total };
};

/**
 * Get a single problem by slug (with visible test cases only for players).
 */
export const getProblemBySlug = async (slug) => {
  const problem = await Problem.findOne({ slug });
  if (!problem) throw new ApiError(404, "Problem not found");

  // Filter to only visible test cases
  const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden);

  return {
    ...problem.toObject(),
    testCases: visibleTestCases,
  };
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
 * Stage → difficultyRating ranges (matches STAGES in match.service.js).
 */
const STAGE_RANGES = [
  { min: 800, max: 1099 },   // Stage 0
  { min: 1100, max: 1399 },  // Stage 1
  { min: 1400, max: 1699 },  // Stage 2
  { min: 1700, max: 1999 },  // Stage 3
  { min: 2000, max: 2400 },  // Stage 4
];

/**
 * Get a random problem from the local Problem Bank for a given stage.
 * Returns the problem WITHOUT hidden test cases (for display to player).
 */
export const getRandomProblemForStage = async (stage = 0) => {
  const range = STAGE_RANGES[stage] || STAGE_RANGES[0];
  const problems = await Problem.find({
    difficultyRating: { $gte: range.min, $lte: range.max },
  }).select("-testCases");

  if (!problems || problems.length === 0) {
    throw new ApiError(404, `No problems found for stage ${stage}`);
  }

  // Pick a random one
  const picked = problems[Math.floor(Math.random() * problems.length)];

  // Fetch full doc with visible test cases only
  const full = await Problem.findById(picked._id);
  const visible = full.testCases.filter((tc) => !tc.isHidden);
  return { ...full.toObject(), testCases: visible };
};

/**
 * Get a deterministic stage problem for a match.
 * First request for (match, stage) assigns a random problem and persists it.
 * Subsequent requests always return the same problem for all players.
 */
export const getOrAssignStageProblemForMatch = async (matchId, stage = 0) => {
  const maxStageIndex = Math.max(0, STAGE_RANGES.length - 1);
  const safeStage = Number.isFinite(stage)
    ? Math.max(0, Math.min(maxStageIndex, Number(stage)))
    : 0;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new ApiError(404, "Match not found");
  }

  const stageKey = String(safeStage);
  let problemId = match.stageProblemMap?.get?.(stageKey);

  if (!problemId) {
    const range = STAGE_RANGES[safeStage] || STAGE_RANGES[0];
    const problems = await Problem.find({
      difficultyRating: { $gte: range.min, $lte: range.max },
    }).select("_id");

    if (!problems || problems.length === 0) {
      throw new ApiError(404, `No problems found for stage ${safeStage}`);
    }

    problemId = problems[Math.floor(Math.random() * problems.length)]._id;
    match.stageProblemMap.set(stageKey, problemId);
    await match.save();
  }

  const full = await Problem.findById(problemId);
  if (!full) {
    throw new ApiError(404, "Assigned stage problem not found");
  }

  const visible = full.testCases.filter((tc) => !tc.isHidden);
  return { ...full.toObject(), testCases: visible };
};
