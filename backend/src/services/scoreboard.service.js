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
// getIcpcScoreboard
// ---------------------------------------------------------------------------

/**
 * Build an ICPC-style scoreboard for a match.
 * Rank by: problems solved DESC, then total penalty time ASC.
 * Penalty = minutes from match start to AC + 20 * wrong attempts before AC.
 *
 * @param {string} matchId
 * @returns {Promise<Array>}
 */
export const getIcpcScoreboard = async (matchId) => {
  // Get match for startTime
  const { Match } = await import('../models/match.model.js');
  const match = await Match.findById(matchId);
  if (!match) return [];

  const playerStates = await PlayerState.find({ matchId }).populate('userId', 'name avatar rating');

  // Get all submissions for this match sorted by submission time
  const { Submission } = await import('../models/submission.model.js');
  const submissions = await Submission.find({ matchId }).sort({ submittedAt: 1 });

  // Build per-player ICPC stats
  const statsMap = {};
  for (const ps of playerStates) {
    statsMap[ps.userId._id.toString()] = {
      userId: ps.userId,
      teamId: ps.teamId,
      solved: 0,
      penaltyMinutes: 0,
      isAlive: ps.isAlive,
      problemAttempts: {},
      problemSolved: new Set(),
    };
  }

  for (const sub of submissions) {
    const uid = sub.userId.toString();
    const stat = statsMap[uid];
    if (!stat) continue;

    const pid = sub.problemId;
    if (!stat.problemAttempts[pid]) stat.problemAttempts[pid] = 0;

    if (sub.verdict === 'Accepted' && !stat.problemSolved.has(pid)) {
      const minutesFromStart = match.startTime
        ? (new Date(sub.submittedAt) - new Date(match.startTime)) / 60000
        : 0;
      const wrongPenalty = stat.problemAttempts[pid] * 20;
      stat.penaltyMinutes += Math.round(minutesFromStart + wrongPenalty);
      stat.solved += 1;
      stat.problemSolved.add(pid);
    } else if (sub.verdict !== 'Accepted') {
      // Only count WA before AC
      if (!stat.problemSolved.has(pid)) {
        stat.problemAttempts[pid] += 1;
      }
    }
  }

  // Sort: solved DESC, penaltyMinutes ASC
  const sorted = Object.values(statsMap).sort((a, b) => {
    if (b.solved !== a.solved) return b.solved - a.solved;
    return a.penaltyMinutes - b.penaltyMinutes;
  });

  return sorted.map((s, i) => ({
    rank: i + 1,
    userId: s.userId,
    teamId: s.teamId,
    solved: s.solved,
    penaltyMinutes: s.penaltyMinutes,
    isAlive: s.isAlive,
  }));
};

// ---------------------------------------------------------------------------
// broadcastScoreboard
// ---------------------------------------------------------------------------

/**
 * Fetch the current scoreboard and emit it to all clients in the room.
 * Uses ICPC scoring when gameMode is ICPC_STYLE, otherwise standard scoring.
 * Emits 'scoreboard:update' event.
 *
 * @param {string} matchId
 * @param {string} roomId
 * @param {import("socket.io").Server} io
 * @returns {Promise<Array>} the scoreboard that was broadcast
 */
export const broadcastScoreboard = async (matchId, roomId, io) => {
  const { Match } = await import('../models/match.model.js');
  const match = await Match.findById(matchId);

  let scoreboard;
  if (match?.gameMode === 'ICPC_STYLE') {
    scoreboard = await getIcpcScoreboard(matchId);
  } else {
    scoreboard = await getScoreboard(matchId);
  }

  io.to(roomId.toString()).emit("scoreboard:update", scoreboard);
  return scoreboard;
};
