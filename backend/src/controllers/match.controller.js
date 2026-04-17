import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { Match } from "../models/match.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Leaderboard } from "../models/leaderboard.model.js";

/**
 * GET /api/matches/history/me
 * Returns the authenticated user's match history with stats.
 */
export const getMyMatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // Find all matches where this user participated
  const matches = await Match.find({ players: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("players", "name avatar")
    .lean();

  const total = await Match.countDocuments({ players: userId });

  // Enrich each match with this user's performance
  const enriched = await Promise.all(
    matches.map(async (match) => {
      const ps = await PlayerState.findOne({
        matchId: match._id,
        userId,
      }).lean();

      const isWinner = match.winnerIds?.some(
        (w) => w.toString() === userId.toString()
      );

      return {
        _id: match._id,
        gameMode: match.gameMode,
        status: match.status,
        startTime: match.startTime,
        endTime: match.endTime,
        playerCount: match.players?.length || 0,
        isWinner,
        myScore: ps?.score || 0,
        myStage: ps?.currentStage || 0,
        wasEliminated: ps ? !ps.isAlive : false,
        eliminationReason: ps?.eliminationReason || null,
        createdAt: match.createdAt,
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, { matches: enriched, page: Number(page), limit: Number(limit), total }, "Match history fetched")
  );
});

/**
 * GET /api/matches/stats/me
 * Returns the authenticated user's aggregate stats for the dashboard.
 */
export const getMyDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get leaderboard entries across all modes
  const entries = await Leaderboard.find({ userId }).lean();
  
  const globalEntry = entries.find((e) => e.mode === "GLOBAL") || {
    rating: 1000,
    rankTier: "Silver",
    wins: 0,
    losses: 0,
    matchCount: 0,
  };

  // Per-mode breakdown
  const modeStats = entries
    .filter((e) => e.mode !== "GLOBAL")
    .map((e) => ({
      mode: e.mode,
      rating: e.rating,
      rankTier: e.rankTier,
      wins: e.wins,
      losses: e.losses,
      matchCount: e.matchCount,
    }));

  // Recent matches (last 5)
  const recentMatches = await Match.find({ players: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentResults = await Promise.all(
    recentMatches.map(async (m) => {
      const isWinner = m.winnerIds?.some(
        (w) => w.toString() === userId.toString()
      );
      return {
        matchId: m._id,
        gameMode: m.gameMode,
        status: m.status,
        isWinner,
        date: m.createdAt,
      };
    })
  );

  // Win streak
  let currentStreak = 0;
  for (const r of recentResults) {
    if (r.isWinner) currentStreak++;
    else break;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        global: globalEntry,
        modeStats,
        recentMatches: recentResults,
        currentStreak,
        totalMatches: globalEntry.matchCount,
        totalWins: globalEntry.wins,
        totalLosses: globalEntry.losses,
        winRate:
          globalEntry.matchCount > 0
            ? Math.round((globalEntry.wins / globalEntry.matchCount) * 100)
            : 0,
      },
      "Dashboard stats fetched"
    )
  );
});
