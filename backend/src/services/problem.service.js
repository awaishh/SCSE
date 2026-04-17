import { Problem } from "../models/problem.model.js";
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
