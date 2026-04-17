import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import * as scoreboardService from "../services/scoreboard.service.js";

// ---------------------------------------------------------------------------
// GET /api/scoreboard/:matchId
// ---------------------------------------------------------------------------

/**
 * Return the ranked individual scoreboard for a match.
 */
export const getMatchScoreboard = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const scoreboard = await scoreboardService.getScoreboard(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, scoreboard, "Scoreboard fetched"));
});

// ---------------------------------------------------------------------------
// GET /api/scoreboard/:matchId/teams
// ---------------------------------------------------------------------------

/**
 * Return the team-aggregated scoreboard for a match.
 */
export const getMatchTeamScoreboard = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const scoreboard = await scoreboardService.getTeamScoreboard(matchId);

  return res
    .status(200)
    .json(new ApiResponse(200, scoreboard, "Team scoreboard fetched"));
});
