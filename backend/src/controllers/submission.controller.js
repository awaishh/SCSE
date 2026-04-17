import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import * as submissionService from "../services/submission.service.js";

// ---------------------------------------------------------------------------
// POST /api/submissions/submit
// ---------------------------------------------------------------------------

/**
 * Accept a code submission from an authenticated player.
 * Returns 202 Accepted immediately; verdict is also pushed via Socket.IO.
 */
export const submitCode = asyncHandler(async (req, res) => {
  const { matchId, problemId, language, sourceCode } = req.body;

  // Basic presence check (express-validator handles detailed rules)
  if (!matchId || !problemId || !language || !sourceCode) {
    throw new ApiError(400, "matchId, problemId, language, and sourceCode are required");
  }

  const io = req.app.get("io");
  const submission = await submissionService.submit(
    matchId,
    req.user._id,
    problemId,
    language,
    sourceCode,
    io
  );

  return res
    .status(202)
    .json(new ApiResponse(202, submission, "Submission received"));
});

// ---------------------------------------------------------------------------
// GET /api/submissions/match/:matchId
// ---------------------------------------------------------------------------

/**
 * Return all submissions for a given match.
 */
export const getMatchSubmissions = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const submissions = await submissionService.getSubmissionsByMatch(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Submissions fetched"));
});

// ---------------------------------------------------------------------------
// GET /api/submissions/match/:matchId/me
// ---------------------------------------------------------------------------

/**
 * Return the authenticated user's submissions for a given match.
 */
export const getUserSubmissions = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const submissions = await submissionService.getSubmissionsByUser(
    matchId,
    req.user._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "User submissions fetched"));
});

// ---------------------------------------------------------------------------
// GET /api/submissions/match/:matchId/scoreboard
// ---------------------------------------------------------------------------

/**
 * Return the ranked scoreboard for a given match.
 */
export const getScoreboard = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const scoreboard = await submissionService.getScoreboard(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, scoreboard, "Scoreboard fetched"));
});
