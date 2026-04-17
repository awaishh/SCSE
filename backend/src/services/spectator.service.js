import { Match } from "../models/match.model.js";
import { Spectator } from "../models/spectator.model.js";
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

// ---------------------------------------------------------------------------
// getSpectators
// ---------------------------------------------------------------------------

/**
 * Return all current spectators for a match, with user info populated.
 *
 * @param {string} matchId
 * @returns {Promise<Array>}
 */
export const getSpectators = async (matchId) => {
  return Spectator.find({ matchId }).populate("userId", "name avatar");
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
