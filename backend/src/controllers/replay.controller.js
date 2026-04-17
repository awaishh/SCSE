import * as replayService from "../services/replay.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// ---------------------------------------------------------------------------
// getReplay  GET /api/replay/:matchId
// ---------------------------------------------------------------------------

/**
 * Fetch the finalized replay for a match.
 * Returns 404 if the replay doesn't exist or hasn't been finalized yet.
 */
export const getReplay = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const replay = await replayService.getReplay(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, replay, "Replay fetched successfully"));
});
