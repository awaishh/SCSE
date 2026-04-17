import { PlayerState } from "../models/playerState.model.js";
import { STAGES } from "./match.service.js";

// ---------------------------------------------------------------------------
// getScoreboard
// ---------------------------------------------------------------------------

/**
 * Build a ranked scoreboard for a match.
 * Populates userId with name, avatar, and rating.
 * Sort order: currentStage DESC → score DESC → wrongAttempts ASC
 *
 * @param {string} matchId
 * @returns {Promise<Array>}
 */
export const getScoreboard = async (matchId) => {
  const playerStates = await PlayerState.find({ matchId }).populate(
    "userId",
    "name avatar rating"
  );

  const sorted = [...playerStates].sort((a, b) => {
    if (b.currentStage !== a.currentStage) return b.currentStage - a.currentStage;
    if (b.score !== a.score) return b.score - a.score;
    return a.wrongAttempts - b.wrongAttempts;
  });

  return sorted.map((ps, index) => ({
    rank: index + 1,
    userId: ps.userId,                        // populated: { _id, name, avatar, rating }
    teamId: ps.teamId,
    currentStage: ps.currentStage,
    stageDifficulty: STAGES[ps.currentStage], // e.g. 1100, 1200, …
    score: ps.score,
    wrongAttempts: ps.wrongAttempts,
    isAlive: ps.isAlive,
    eliminationReason: ps.eliminationReason,
    lastActiveAt: ps.lastActiveAt,
  }));
};

// ---------------------------------------------------------------------------
// getTeamScoreboard
// ---------------------------------------------------------------------------

/**
 * Build a team-aggregated scoreboard for a match.
 * Groups PlayerState documents by teamId, sums scores, and ranks by totalScore DESC.
 *
 * @param {string} matchId
 * @returns {Promise<Array>}
 */
export const getTeamScoreboard = async (matchId) => {
  const playerStates = await PlayerState.find({ matchId }).populate(
    "userId",
    "name avatar rating"
  );

  // Group by teamId
  const teamMap = new Map();

  for (const ps of playerStates) {
    const tid = ps.teamId ?? "default";

    if (!teamMap.has(tid)) {
      teamMap.set(tid, {
        teamId: tid,
        totalScore: 0,
        members: [],
      });
    }

    const team = teamMap.get(tid);
    team.totalScore += ps.score;
    team.members.push({
      userId: ps.userId,
      currentStage: ps.currentStage,
      score: ps.score,
      wrongAttempts: ps.wrongAttempts,
      isAlive: ps.isAlive,
    });
  }

  // Sort teams by totalScore DESC
  const sorted = [...teamMap.values()].sort((a, b) => b.totalScore - a.totalScore);

  return sorted.map((team, index) => ({
    rank: index + 1,
    teamId: team.teamId,
    totalScore: team.totalScore,
    members: team.members,
    // A team is eliminated only when every member is out
    isEliminated: team.members.every((m) => !m.isAlive),
  }));
};

// ---------------------------------------------------------------------------
// broadcastScoreboard
// ---------------------------------------------------------------------------

/**
 * Fetch the current scoreboard and emit it to all clients in the room.
 * Emits 'scoreboard:update' event.
 *
 * @param {string} matchId
 * @param {string} roomId
 * @param {import("socket.io").Server} io
 * @returns {Promise<Array>} the scoreboard that was broadcast
 */
export const broadcastScoreboard = async (matchId, roomId, io) => {
  const scoreboard = await getScoreboard(matchId);
  io.to(roomId.toString()).emit("scoreboard:update", scoreboard);
  return scoreboard;
};
