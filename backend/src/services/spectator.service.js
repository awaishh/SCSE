import { Match } from "../models/match.model.js";
import { Spectator } from "../models/spectator.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Room, GAME_MODES } from "../models/room.model.js";
import { ApiError } from "../utils/api-error.js";

// ---------------------------------------------------------------------------
// joinSpectate
// ---------------------------------------------------------------------------

/**
 * Register a user as a spectator for a live match.
 * Emits 'spectator:joined' to everyone in the match room.
 *
 * @param {string} userId
 * @param {string} matchId
 * @param {import("socket.io").Server} io
 * @returns {Promise<{ match: object, spectatorCount: number }>}
 */
export const joinSpectate = async (userId, matchId, io) => {
  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Only allow spectating live matches
  if (match.status !== "LIVE") {
    throw new ApiError(400, "Match is not live");
  }

  // Upsert: create or refresh the spectator record
  await Spectator.findOneAndUpdate(
    { matchId, userId },
    { matchId, userId, joinedAt: new Date() },
    { upsert: true, new: true }
  );

  // Notify everyone in the room that a new spectator joined
  io.to(match.roomId.toString()).emit("spectator:joined", {
    userId,
    matchId,
    timestamp: new Date(),
  });

  const spectatorCount = await Spectator.countDocuments({ matchId });

  return { match, spectatorCount };
};

// ---------------------------------------------------------------------------
// leaveSpectate
// ---------------------------------------------------------------------------

/**
 * Remove a user's spectator record and notify the room.
 *
 * @param {string} userId
 * @param {string} matchId
 * @param {import("socket.io").Server} io
 * @returns {Promise<{ success: boolean }>}
 */
export const leaveSpectate = async (userId, matchId, io) => {
  // Remove the spectator record
  await Spectator.deleteOne({ matchId, userId });

  // Notify the room if the match still exists
  const match = await Match.findById(matchId);
  if (match) {
    io.to(match.roomId.toString()).emit("spectator:left", {
      userId,
      matchId,
    });
  }

  return { success: true };
};

/**
 * Return match details and players for a spectator joining a specific match.
 *
 * @param {string} matchId
 * @returns {Promise<object>}
 */
export const getSpectatorMatchDetails = async (matchId) => {
  const match = await Match.findById(matchId).populate("players", "name avatar").lean();
  if (!match) throw new ApiError(404, "Match not found");

  const spectatorCount = await Spectator.countDocuments({ matchId });
  const playerStates = await PlayerState.find({ matchId })
    .populate("userId", "name avatar")
    .lean();

  const BLITZ_MODES = ["BLITZ_1V1", "BLITZ_3V3"];
  const durationMs = BLITZ_MODES.includes(match.gameMode) ? 15 * 60 * 1000 : 30 * 60 * 1000;
  const endTime = match.startTime ? new Date(new Date(match.startTime).getTime() + durationMs) : null;

  return {
    matchId: match._id,
    gameMode: match.gameMode,
    status: match.status,
    startTime: match.startTime,
    endTime,
    spectatorCount,
    players: playerStates.map((ps) => ({
      userId: ps.userId?._id || ps.userId,
      name: ps.userId?.name || "Player",
      avatar: ps.userId?.avatar || null,
      teamId: ps.teamId,
      score: ps.score,
      currentStage: ps.currentStage,
      wrongAttempts: ps.wrongAttempts,
    })),
    scoreboard: playerStates.map((ps) => ({
      userId: ps.userId?._id || ps.userId,
      name: ps.userId?.name || "Player",
      score: ps.score,
      currentStage: ps.currentStage,
    }))
  };
};

// ---------------------------------------------------------------------------
// getSpectatorCount
// ---------------------------------------------------------------------------

/**
 * Return the number of spectators currently watching a match.
 *
 * @param {string} matchId
 * @returns {Promise<number>}
 */
export const getSpectatorCount = async (matchId) => {
  return Spectator.countDocuments({ matchId });
};

// ---------------------------------------------------------------------------
// getLiveMatches
// ---------------------------------------------------------------------------

/**
 * Return all currently LIVE matches with player info and spectator counts.
 * Used for the "Browse Live Matches" UI.
 *
 * @returns {Promise<Array>}
 */
export const getLiveMatches = async () => {
  const matches = await Match.find({ status: "LIVE" })
    .populate("players", "name avatar")
    .sort({ startTime: -1 })
    .lean();

  const BLITZ_MODES = ["BLITZ_1V1", "BLITZ_3V3"];

  const results = await Promise.all(
    matches.map(async (match) => {
      const spectatorCount = await Spectator.countDocuments({ matchId: match._id });

      // Get player states for names and scores
      const playerStates = await PlayerState.find({ matchId: match._id })
        .populate("userId", "name avatar")
        .lean();

      const durationMs = BLITZ_MODES.includes(match.gameMode)
        ? 15 * 60 * 1000
        : 30 * 60 * 1000;
      const endTime = match.startTime
        ? new Date(new Date(match.startTime).getTime() + durationMs)
        : null;

      return {
        matchId: match._id,
        gameMode: match.gameMode,
        status: match.status,
        startTime: match.startTime,
        endTime,
        spectatorCount,
        players: playerStates.map((ps) => ({
          userId: ps.userId?._id || ps.userId,
          name: ps.userId?.name || "Player",
          avatar: ps.userId?.avatar || null,
          teamId: ps.teamId,
          score: ps.score,
          currentStage: ps.currentStage,
        })),
      };
    })
  );

  return results;
};

// ---------------------------------------------------------------------------
// cleanupSpectators
// ---------------------------------------------------------------------------

/**
 * Remove all spectator records for a match (called when match ends).
 *
 * @param {string} matchId
 * @returns {Promise<number>} Number of records deleted
 */
export const cleanupSpectators = async (matchId) => {
  const result = await Spectator.deleteMany({ matchId });
  return result.deletedCount;
};

// ---------------------------------------------------------------------------
// removeUserSpectating
// ---------------------------------------------------------------------------

/**
 * Remove all spectator records for a user (called on disconnect).
 *
 * @param {string} userId
 * @param {import("socket.io").Server} io
 */
export const removeUserSpectating = async (userId, io) => {
  const records = await Spectator.find({ userId });
  for (const rec of records) {
    const match = await Match.findById(rec.matchId);
    if (match) {
      io.to(match.roomId.toString()).emit("spectator:left", {
        userId,
        matchId: rec.matchId.toString(),
      });
    }
  }
  await Spectator.deleteMany({ userId });
};
