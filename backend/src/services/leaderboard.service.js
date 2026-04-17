import { Match } from '../models/match.model.js';
import { PlayerState } from '../models/playerState.model.js';
import { User } from '../models/user.model.js';
import { Leaderboard, LEADERBOARD_MODES } from '../models/leaderboard.model.js';
import { getRankTier } from '../utils/rankTier.js';
import { ApiError } from '../utils/api-error.js';

// Game modes where all winnerIds win and all others lose (no individual ranking)
const TEAM_MODES = new Set(['TEAM_DUEL_2V2', 'TEAM_DUEL_3V3', 'ICPC_STYLE']);

// Valid per-mode values (excludes GLOBAL)
const GAME_MODES = LEADERBOARD_MODES.filter((m) => m !== 'GLOBAL');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Linearly interpolate a delta between +25 (rank 1) and -15 (last rank).
 * rankIndex is 0-based (0 = first place).
 */
function interpolateDelta(rankIndex, totalPlayers) {
  if (totalPlayers === 1) return 25; // only player, treat as winner
  const t = rankIndex / (totalPlayers - 1); // 0 → first, 1 → last
  return Math.round(25 + t * (-15 - 25)); // 25 → -15
}

/**
 * Upsert a Leaderboard record for a given userId + mode, applying the delta.
 * @param {string} userId
 * @param {string} mode
 * @param {number} delta  positive = win, negative = loss
 * @param {number} newRating  already-clamped new rating
 * @param {boolean} isWin
 */
async function upsertLeaderboardEntry(userId, mode, newRating, isWin) {
  const rankTier = getRankTier(newRating);

  await Leaderboard.findOneAndUpdate(
    { userId, mode },
    {
      $set: { rating: newRating, rankTier },
      $inc: {
        wins: isWin ? 1 : 0,
        losses: isWin ? 0 : 1,
        matchCount: 1,
      },
    },
    { upsert: true, new: true }
  );
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Compute and persist ELO-style rating changes for all players in a match.
 * Called from endMatch after match.winnerIds is set.
 *
 * @param {string} matchId
 * @returns {Promise<Array<{ userId, delta, newRating, rankTier }>>}
 */
export const updateRatingsAfterMatch = async (matchId) => {
  const match = await Match.findById(matchId).populate('players', 'name rating');

  if (!match) return [];
  if (match.status !== 'FINISHED') return [];

  const playerIds = match.players.map((p) => p._id.toString());
  const winnerSet = new Set(match.winnerIds.map((id) => id.toString()));

  // Fetch all PlayerState docs for ranking in solo/FFA modes
  const playerStates = await PlayerState.find({ matchId: match._id }).sort({
    currentStage: -1,
    score: -1,
    wrongAttempts: 1,
  });

  // Build a map: userId → ranked index (0 = best)
  const rankMap = {};
  playerStates.forEach((ps, idx) => {
    rankMap[ps.userId.toString()] = idx;
  });

  const totalPlayers = playerIds.length;

  // Compute delta per player
  const deltas = {};

  if (TEAM_MODES.has(match.gameMode)) {
    // Team mode: flat +25 for winners, -15 for losers
    for (const uid of playerIds) {
      deltas[uid] = winnerSet.has(uid) ? 25 : -15;
    }
  } else if (totalPlayers === 2) {
    // 1v1: winner +25, loser -15
    for (const uid of playerIds) {
      deltas[uid] = winnerSet.has(uid) ? 25 : -15;
    }
  } else {
    // Multi-player FFA (Battle Royale, Knockout, etc.): linear interpolation
    for (const uid of playerIds) {
      const rankIndex = rankMap[uid] ?? totalPlayers - 1;
      deltas[uid] = interpolateDelta(rankIndex, totalPlayers);
    }
  }

  // Apply deltas and persist
  const results = [];
  const userDocs = await User.find({ _id: { $in: playerIds } });
  const userMap = Object.fromEntries(userDocs.map((u) => [u._id.toString(), u]));

  const savePromises = [];

  for (const uid of playerIds) {
    const user = userMap[uid];
    if (!user) continue;

    const delta = deltas[uid] ?? 0;
    const newRating = Math.max(0, user.rating + delta); // never below 0
    const isWin = winnerSet.has(uid);

    user.rating = newRating;
    user.matchCount = (user.matchCount || 0) + 1;
    savePromises.push(user.save());

    // Upsert per-mode and GLOBAL leaderboard entries in parallel
    savePromises.push(
      upsertLeaderboardEntry(uid, match.gameMode, newRating, isWin),
      upsertLeaderboardEntry(uid, 'GLOBAL', newRating, isWin)
    );

    results.push({
      userId: uid,
      delta,
      newRating,
      rankTier: getRankTier(newRating),
    });
  }

  await Promise.all(savePromises);

  return results;
};

/**
 * Paginated global leaderboard (mode = 'GLOBAL'), sorted by rating DESC.
 */
export const getGlobalLeaderboard = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Leaderboard.find({ mode: 'GLOBAL' })
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar'),
    Leaderboard.countDocuments({ mode: 'GLOBAL' }),
  ]);

  return { data, page: Number(page), limit: Number(limit), total };
};

/**
 * Paginated per-mode leaderboard, sorted by rating DESC.
 * @param {string} mode  one of the 7 game modes
 */
export const getModeLeaderboard = async (mode, page = 1, limit = 50) => {
  if (!GAME_MODES.includes(mode)) {
    throw new ApiError(400, `Invalid game mode: ${mode}. Must be one of: ${GAME_MODES.join(', ')}`);
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Leaderboard.find({ mode })
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar'),
    Leaderboard.countDocuments({ mode }),
  ]);

  return { data, page: Number(page), limit: Number(limit), total };
};

/**
 * Return all leaderboard entries for a single player across all modes.
 * @param {string} userId
 */
export const getPlayerStats = async (userId) => {
  const entries = await Leaderboard.find({ userId }).select(
    'mode rating rankTier wins losses matchCount -_id'
  );
  return entries;
};
