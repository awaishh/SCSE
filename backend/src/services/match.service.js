import { Match } from "../models/match.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Room, GAME_MODES } from "../models/room.model.js";
import { ApiError } from "../utils/api-error.js";

// Difficulty levels players progress through during a match
export const STAGES = [1100, 1200, 1300, 1400, 1500];

// Team modes where winners are determined by team aggregate score
const TEAM_MODES = new Set(["TEAM_DUEL_2V2", "TEAM_DUEL_3V3", "ICPC_STYLE"]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Transition a match from COUNTDOWN → LIVE.
 * Called automatically after the 10-second countdown.
 */
async function _goLive(matchId, roomId, io) {
  const match = await Match.findById(matchId);
  if (!match) return;

  // Guard: only proceed if still in COUNTDOWN (prevents double-trigger)
  if (match.status !== "COUNTDOWN") return;

  // Transition match → LIVE
  match.status = "LIVE";
  match.startTime = new Date();
  await match.save();

  // Reset lastActiveAt for all players so inactivity timers start fresh
  await PlayerState.updateMany(
    { matchId: match._id },
    { $set: { lastActiveAt: new Date() } }
  );

  // Transition room → LIVE
  const room = await Room.findById(roomId);
  if (room) {
    room.status = "LIVE";
    await room.save();
  }

  // Notify all clients in the room channel
  io.to(roomId.toString()).emit("match:state-changed", {
    matchId: match._id,
    status: "LIVE",
    startTime: match.startTime,
  });
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Start a match for the given room.
 * Validates host identity and minimum player count, creates Match + PlayerState
 * documents, kicks off the 10-second countdown, then transitions to LIVE.
 *
 * State transition: Room WAITING → COUNTDOWN (→ LIVE after 10 s)
 */
export const startMatch = async (roomId, hostId, io) => {
  const room = await Room.findById(roomId).populate("players.userId");

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // Only a WAITING room can start
  if (room.status !== "WAITING") {
    throw new ApiError(400, "Room is not in WAITING state");
  }

  // Only the host may start the match
  if (room.hostId.toString() !== hostId.toString()) {
    throw new ApiError(403, "Only the host can start the match");
  }

  const minPlayers = GAME_MODES[room.gameMode].min;
  if (room.players.length < minPlayers) {
    throw new ApiError(400, "Not enough players");
  }

  const playerUserIds = room.players.map((p) => p.userId._id ?? p.userId);

  // Create the Match document in COUNTDOWN state
  const match = await Match.create({
    roomId: room._id,
    gameMode: room.gameMode,
    status: "COUNTDOWN",
    players: playerUserIds,
    startTime: null,
  });

  // For KNOCKOUT mode, generate and persist the bracket immediately
  if (room.gameMode === "KNOCKOUT") {
    match.bracketData = generateKnockoutBracket(playerUserIds);
    await match.save();
  }

  // Transition room to COUNTDOWN
  room.status = "COUNTDOWN";
  await room.save();

  // Create a PlayerState for every participant
  const playerStateDocs = playerUserIds.map((userId) => ({
    matchId: match._id,
    userId,
    lastActiveAt: new Date(),
  }));
  await PlayerState.insertMany(playerStateDocs);

  // Notify clients that the countdown has begun
  io.to(roomId.toString()).emit("match:state-changed", {
    matchId: match._id,
    status: "COUNTDOWN",
    gameMode: room.gameMode,
  });

  // Non-blocking 10-second countdown before going live
  setTimeout(() => _goLive(match._id, room._id, io), 10_000);

  return match;
};

/**
 * End a match immediately, compute winners, and notify clients.
 *
 * State transition: Match LIVE → FINISHED, Room LIVE → FINISHED
 */
export const endMatch = async (matchId, io) => {
  const match = await Match.findById(matchId).populate("players");

  if (!match) {
    throw new ApiError(404, "Match not found");
  }

  // Idempotency guard
  if (match.status === "FINISHED") return match;

  match.status = "FINISHED";
  match.endTime = new Date();

  // Fetch all player states for scoreboard + winner computation
  const playerStates = await PlayerState.find({ matchId: match._id });

  let winnerIds = [];

  if (TEAM_MODES.has(match.gameMode)) {
    // --- Team mode: aggregate score per team, winning team members all win ---
    const teamScores = {};
    for (const ps of playerStates) {
      const tid = ps.teamId ?? "default";
      if (!teamScores[tid]) teamScores[tid] = { score: 0, members: [] };
      teamScores[tid].score += ps.score;
      teamScores[tid].members.push(ps.userId);
    }

    const sortedTeams = Object.values(teamScores).sort(
      (a, b) => b.score - a.score
    );

    if (sortedTeams.length > 0) {
      winnerIds = sortedTeams[0].members;
    }
  } else {
    // --- Solo / FFA mode: rank by stage DESC, score DESC, wrongAttempts ASC ---
    const sorted = [...playerStates].sort((a, b) => {
      if (b.currentStage !== a.currentStage) return b.currentStage - a.currentStage;
      if (b.score !== a.score) return b.score - a.score;
      return a.wrongAttempts - b.wrongAttempts;
    });

    if (sorted.length > 0) {
      winnerIds = [sorted[0].userId];
    }
  }

  match.winnerIds = winnerIds;
  await match.save();

  // Transition room → FINISHED
  const room = await Room.findById(match.roomId);
  if (room) {
    room.status = "FINISHED";
    await room.save();
  }

  // Build final scoreboard for the event payload
  const finalScoreboard = playerStates.map((ps) => ({
    userId: ps.userId,
    teamId: ps.teamId,
    currentStage: ps.currentStage,
    score: ps.score,
    wrongAttempts: ps.wrongAttempts,
    isAlive: ps.isAlive,
    eliminationReason: ps.eliminationReason,
  }));

  io.to(match.roomId.toString()).emit("match:finished", {
    matchId: match._id,
    winnerIds,
    finalScoreboard,
  });

  return match;
};

/**
 * Fetch a single match by its ObjectId, with players populated.
 */
export const getMatchById = async (matchId) => {
  const match = await Match.findById(matchId).populate("players", "name avatar");

  if (!match) {
    throw new ApiError(404, "Match not found");
  }

  return match;
};

/**
 * Fetch the most recent match associated with a room.
 */
export const getMatchByRoomId = async (roomId) => {
  const match = await Match.findOne({ roomId })
    .sort({ createdAt: -1 })
    .populate("players", "name avatar");

  if (!match) {
    throw new ApiError(404, "No match found for this room");
  }

  return match;
};

/**
 * Generate a single-elimination knockout bracket from an array of player IDs.
 * Players are paired sequentially; an odd player out receives a bye (auto-win).
 *
 * @param {Array} players - Array of user ObjectIds
 * @returns {{ rounds: Array }} bracket object
 */
export const generateKnockoutBracket = (players) => {
  const matches = [];

  for (let i = 0; i < players.length; i += 2) {
    if (i + 1 < players.length) {
      // Normal pairing
      matches.push({
        player1: players[i],
        player2: players[i + 1],
        winner: null,
      });
    } else {
      // Odd player out — automatic bye
      matches.push({
        player1: players[i],
        player2: null,
        winner: players[i],
      });
    }
  }

  return {
    rounds: [
      {
        round: 1,
        matches,
      },
    ],
  };
};
