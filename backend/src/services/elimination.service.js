import { Match } from "../models/match.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { broadcastScoreboard } from "./scoreboard.service.js";

// ---------------------------------------------------------------------------
// In-memory timer registry
// ---------------------------------------------------------------------------

/** matchId (string) → intervalId */
const activeTimers = new Map();

// ---------------------------------------------------------------------------
// startInactivityTimer
// ---------------------------------------------------------------------------

/**
 * Start a 60-second polling interval that eliminates inactive players.
 * Only applicable to BATTLE_ROYALE matches.
 * A player is eliminated if they have not submitted for >= 10 minutes.
 *
 * Uses a dynamic import for endMatch to avoid a circular dependency with
 * match.service.js (which imports this file).
 *
 * @param {string} matchId
 * @param {string} roomId
 * @param {import("socket.io").Server} io
 */
export const startInactivityTimer = (matchId, roomId, io) => {
  // Prevent duplicate timers for the same match
  if (activeTimers.has(matchId)) return;

  const intervalId = setInterval(async () => {
    try {
      // 1. Verify the match is still live
      const match = await Match.findById(matchId);
      if (!match || match.status !== "LIVE") {
        clearInterval(intervalId);
        activeTimers.delete(matchId);
        return;
      }

      // 2. Only run for BATTLE_ROYALE matches
      if (match.gameMode !== "BATTLE_ROYALE") {
        clearInterval(intervalId);
        activeTimers.delete(matchId);
        return;
      }

      // 3. Find all alive players in this match
      const alivePlayers = await PlayerState.find({ matchId, isAlive: true });

      const now = Date.now();

      for (const player of alivePlayers) {
        const minutesSinceActive = (now - new Date(player.lastActiveAt).getTime()) / 60_000;

        if (minutesSinceActive >= 10) {
          // Eliminate for inactivity
          player.isAlive = false;
          player.eliminationReason = "INACTIVITY";
          await player.save();

          // Notify all clients in the room
          io.to(roomId.toString()).emit("player:eliminated", {
            userId: player.userId,
            reason: "INACTIVITY",
            matchId,
            timestamp: new Date(),
          });

          console.log(
            `Player ${player.userId} eliminated for inactivity in match ${matchId}`
          );
        }
      }

      // 4. Broadcast updated scoreboard after processing eliminations
      await broadcastScoreboard(matchId, roomId, io);

      // 5. If all players are now eliminated, end the match
      const remainingAlive = await PlayerState.countDocuments({ matchId, isAlive: true });
      if (remainingAlive === 0) {
        // Dynamic import to avoid circular dependency
        const { endMatch } = await import("./match.service.js");
        await endMatch(matchId, io);

        clearInterval(intervalId);
        activeTimers.delete(matchId);
      }
    } catch (err) {
      console.error(`Inactivity timer error for match ${matchId}:`, err);
    }
  }, 60_000); // tick every 60 seconds

  activeTimers.set(matchId, intervalId);
};

// ---------------------------------------------------------------------------
// stopInactivityTimer
// ---------------------------------------------------------------------------

/**
 * Stop and clean up the inactivity timer for a match.
 *
 * @param {string} matchId
 */
export const stopInactivityTimer = (matchId) => {
  if (activeTimers.has(matchId)) {
    clearInterval(activeTimers.get(matchId));
    activeTimers.delete(matchId);
    console.log(`Inactivity timer stopped for match ${matchId}`);
  }
};

// ---------------------------------------------------------------------------
// isTimerActive
// ---------------------------------------------------------------------------

/**
 * Check whether an inactivity timer is currently running for a match.
 *
 * @param {string} matchId
 * @returns {boolean}
 */
export const isTimerActive = (matchId) => activeTimers.has(matchId);
