import * as spectatorService from "../services/spectator.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// ---------------------------------------------------------------------------
// joinSpectate  POST /api/spectator/join
// ---------------------------------------------------------------------------

/**
 * Join a live match as a spectator.
 * Body: { matchId }
 */
export const joinSpectate = asyncHandler(async (req, res) => {
  const { matchId } = req.body;
  const io = req.app.get("io");

  const result = await spectatorService.joinSpectate(
    req.user._id,
    matchId,
    io
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Joined as spectator"));
});

// ---------------------------------------------------------------------------
// leaveSpectate  POST /api/spectator/leave
// ---------------------------------------------------------------------------

/**
 * Leave a match you are currently spectating.
 * Body: { matchId }
 */
export const leaveSpectate = asyncHandler(async (req, res) => {
  const { matchId } = req.body;
  const io = req.app.get("io");

  const result = await spectatorService.leaveSpectate(
    req.user._id,
    matchId,
    io
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Left spectator mode"));
});

// ---------------------------------------------------------------------------
// getSpectators  GET /api/spectator/:matchId
// ---------------------------------------------------------------------------

/**
 * Get match details and players for a spectator joining a specific match.
 */
export const getSpectators = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const matchDetails = await spectatorService.getSpectatorMatchDetails(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, matchDetails, "Match details fetched"));
});

// ---------------------------------------------------------------------------
// getLiveMatches  GET /api/spectator/live
// ---------------------------------------------------------------------------

/**
 * Get all currently live matches available for spectating.
 */
export const getLiveMatches = asyncHandler(async (req, res) => {
  const matches = await spectatorService.getLiveMatches();

  return res
    .status(200)
    .json(new ApiResponse(200, matches, "Live matches fetched"));
});
