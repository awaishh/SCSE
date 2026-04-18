import { Match } from "../models/match.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Room, GAME_MODES } from "../models/room.model.js";
import { ApiError } from "../utils/api-error.js";

// Keep matches minimal to reduce external API usage.
// One stage means one question per match across all game modes.
export const STAGES = [1100];

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

  // Initialise replay document and record the match_start event.
  // Dynamic import avoids a circular dependency with replay.service.
  try {
    const { initReplay, recordEvent } = await import("./replay.service.js");
    await initReplay(match._id.toString());
    await recordEvent(
      match._id.toString(),
      "match_start",
      null,
      { gameMode: match.gameMode },
      match.startTime
    );
  } catch (e) {
    console.error("[replay] init failed:", e);
  }

  // Start inactivity elimination timer for BATTLE_ROYALE matches.
  // Dynamic import avoids a circular dependency (elimination.service imports endMatch).
  if (match.gameMode === "BATTLE_ROYALE") {
    const { startInactivityTimer } = await import("./elimination.service.js");
    startInactivityTimer(match._id.toString(), roomId.toString(), io);
  }

  // Auto-end timer for ALL game modes.
  // Blitz modes: 15 minutes, all other modes: 30 minutes.
  const BLITZ_MODES = ['BLITZ_1V1', 'BLITZ_3V3'];
  const matchDurationMs = BLITZ_MODES.includes(match.gameMode)
    ? 15 * 60 * 1000   // 15 minutes
    : 30 * 60 * 1000;  // 30 minutes

  setTimeout(async () => {
    try {
      const current = await Match.findById(matchId);
      if (current && current.status === 'LIVE') {
        console.log(`[match] Auto-ending match ${matchId} after ${matchDurationMs / 60000} minutes`);
        await endMatch(matchId, io);
      }
    } catch (e) {
      console.error('[match] auto-end failed:', e.message);
    }
  }, matchDurationMs);
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
  const playerStateDocs = playerUserIds.map((userId) => {
    const playerEntry = room.players.find(p => (p.userId._id ?? p.userId).toString() === userId.toString());
    return {
      matchId: match._id,
      userId,
      teamId: playerEntry?.teamId ?? null,
      lastActiveAt: new Date(),
    };
  });
  await PlayerState.insertMany(playerStateDocs);

  // Pre-assign deterministic problems for all configured stages so every player
  // in this match sees identical questions per stage.
  try {
    const { getOrAssignStageProblemForMatch } = await import("./problem.service.js");
    for (let stage = 0; stage < STAGES.length; stage++) {
      await getOrAssignStageProblemForMatch(match._id.toString(), stage);
    }
  } catch (err) {
    console.error("[match:start] stage problem pre-assignment failed:", err.message);
  }

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

  // Stop the inactivity timer if one is running for this match.
  // Dynamic import avoids a circular dependency (elimination.service imports endMatch).
  const { stopInactivityTimer } = await import("./elimination.service.js");
  stopInactivityTimer(matchId.toString());

  // Fetch all player states for scoreboard + winner computation
  const playerStates = await PlayerState.find({ matchId: match._id });

  let winnerIds = [];

  if (Array.isArray(match.winnerIds) && match.winnerIds.length > 0) {
    // Respect a winner pre-set by live gameplay logic (e.g. first finisher).
    winnerIds = match.winnerIds;
  } else if (TEAM_MODES.has(match.gameMode)) {
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

  // Update ELO ratings and leaderboard records for all participants.
  // Dynamic import avoids a circular dependency with leaderboard.service.
  try {
    const { updateRatingsAfterMatch } = await import('./leaderboard.service.js');
    await updateRatingsAfterMatch(match._id.toString());
  } catch (ratingErr) {
    // Rating update failure must not break match end flow
    console.error('[endMatch] Rating update failed:', ratingErr);
  }

  // Record the match_end event and finalize the replay.
  // Dynamic import avoids a circular dependency with replay.service.
  try {
    const { finalizeReplay, recordEvent } = await import("./replay.service.js");
    await recordEvent(
      matchId,
      "match_end",
      null,
      { winnerIds, finalScoreboard },
      match.startTime
    );
    const replay = await finalizeReplay(matchId, finalScoreboard);
    // Notify clients that the replay is ready to watch
    if (replay) {
      io.to(match.roomId.toString()).emit("replay:ready", {
        matchId,
        replayId: replay._id,
      });
    }
  } catch (e) {
    console.error("[replay] finalize failed:", e);
  }

  io.to(match.roomId.toString()).emit("match:finished", {
    matchId: match._id,
    winnerIds,
    finalScoreboard,
  });

  // Close the room after the match has finished so it cannot be reused.
  await Room.findByIdAndDelete(match.roomId);

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
 * Advance the winner of a knockout match to the next round.
 * Handles bracket progression and emits socket events.
 *
 * @param {string} matchId
 * @param {string} winnerId
 * @param {import("socket.io").Server} io
 */
export const advanceKnockoutWinner = async (matchId, winnerId, io) => {
  const match = await Match.findById(matchId);
  if (!match || match.gameMode !== 'KNOCKOUT') return;
  if (!match.bracketData) return;

  const bracket = match.bracketData;
  const rounds = bracket.rounds;
  const currentRound = rounds[rounds.length - 1];

  // Find the match in the current round and set winner
  for (const m of currentRound.matches) {
    if (
      m.player1?.toString() === winnerId.toString() ||
      m.player2?.toString() === winnerId.toString()
    ) {
      m.winner = winnerId;
    }
  }

  // Check if all matches in current round have winners
  const roundComplete = currentRound.matches.every(m => m.winner !== null);

  if (roundComplete) {
    const nextRoundPlayers = currentRound.matches
      .map(m => m.winner)
      .filter(Boolean);

    if (nextRoundPlayers.length === 1) {
      // Tournament over — this is the champion
      match.winnerIds = [nextRoundPlayers[0]];
      match.bracketData = bracket;
      await match.save();
      io.to(match.roomId.toString()).emit('knockout:champion', {
        matchId,
        winnerId: nextRoundPlayers[0],
      });
    } else {
      // Generate next round
      const nextMatches = [];
      for (let i = 0; i < nextRoundPlayers.length; i += 2) {
        if (i + 1 < nextRoundPlayers.length) {
          nextMatches.push({ player1: nextRoundPlayers[i], player2: nextRoundPlayers[i + 1], winner: null });
        } else {
          nextMatches.push({ player1: nextRoundPlayers[i], player2: null, winner: nextRoundPlayers[i] });
        }
      }
      rounds.push({ round: rounds.length + 1, matches: nextMatches });
      match.bracketData = bracket;
      await match.save();
      io.to(match.roomId.toString()).emit('knockout:next-round', {
        matchId,
        round: rounds.length,
        matches: nextMatches,
      });
    }
  } else {
    match.bracketData = bracket;
    await match.save();
  }

  io.to(match.roomId.toString()).emit('knockout:updated', { matchId, bracket: match.bracketData });
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
