import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import * as leaderboardService from '../services/leaderboard.service.js';

/**
 * GET /api/leaderboard/global
 * Public — paginated global leaderboard.
 */
export const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const result = await leaderboardService.getGlobalLeaderboard(
    Number(page),
    Number(limit)
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Global leaderboard fetched successfully'));
});

/**
 * GET /api/leaderboard/mode/:mode
 * Public — paginated per-mode leaderboard.
 */
export const getModeLeaderboard = asyncHandler(async (req, res) => {
  const { mode } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await leaderboardService.getModeLeaderboard(
    mode,
    Number(page),
    Number(limit)
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${mode} leaderboard fetched successfully`));
});

/**
 * GET /api/leaderboard/me
 * Authenticated — returns the current user's stats across all modes.
 */
export const getMyStats = asyncHandler(async (req, res) => {
  const stats = await leaderboardService.getPlayerStats(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Your leaderboard stats fetched successfully'));
});

/**
 * GET /api/leaderboard/player/:userId
 * Public — returns any player's stats across all modes.
 */
export const getPlayerStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const stats = await leaderboardService.getPlayerStats(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Player stats fetched successfully'));
});
