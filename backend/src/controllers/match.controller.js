import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import * as matchService from "../services/match.service.js";
import { Match } from "../models/match.model.js";

/**
 * POST /api/matches/start
 * Body: { roomId }
 * Host-only: starts the match for the given room.
 */
export const startMatch = asyncHandler(async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    throw new ApiError(400, "roomId is required");
  }

  const match = await matchService.startMatch(
    roomId,
    req.user._id,
    req.app.get("io")
  );

  return res
    .status(200)
    .json(new ApiResponse(200, match, "Match countdown started"));
});

/**
 * POST /api/matches/end
 * Body: { matchId }
 * Ends the match; caller must be a participant or the host.
 */
export const endMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.body;

  if (!matchId) {
    throw new ApiError(400, "matchId is required");
  }

  // Verify the requesting user is a participant in this match
  const match = await Match.findById(matchId);
  if (!match) {
    throw new ApiError(404, "Match not found");
  }

  const isParticipant = match.players.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant in this match");
  }

  const finished = await matchService.endMatch(matchId, req.app.get("io"));

  return res
    .status(200)
    .json(new ApiResponse(200, finished, "Match ended"));
});

/**
 * GET /api/matches/:matchId
 * Returns match details with populated player info.
 */
export const getMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const match = await matchService.getMatchById(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, match, "Match fetched successfully"));
});

/**
 * GET /api/matches/room/:roomId
 * Returns the most recent match for the given room.
 */
export const getMatchByRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const match = await matchService.getMatchByRoomId(roomId);

  return res
    .status(200)
    .json(new ApiResponse(200, match, "Match fetched successfully"));
});
