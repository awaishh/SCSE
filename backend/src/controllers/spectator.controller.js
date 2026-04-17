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
 * Get the list of spectators currently watching a match.
 */
export const getSpectators = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const spectators = await spectatorService.getSpectators(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, spectators, "Spectators fetched"));
});
