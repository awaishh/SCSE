import { Match } from "../models/match.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Submission } from "../models/submission.model.js";
import { ApiError } from "../utils/api-error.js";
import { evaluate } from "./judge.service.js";
import { STAGES, endMatch } from "./match.service.js";
import { getScoreboard, broadcastScoreboard } from "./scoreboard.service.js";

// ---------------------------------------------------------------------------
// submit
// ---------------------------------------------------------------------------

/**
 * Handle a code submission for a live match.
 *
 * Flow:
 *  1. Validate match exists and is LIVE
 *  2. Validate player is alive
 *  3. Persist a Pending submission
 *  4. Refresh lastActiveAt
 *  5. Evaluate via stub judge
 *  6. Update submission with verdict
 *  7. Apply scoring / stage progression (Accepted) or wrong-attempt / elimination logic
 *  8. Emit real-time events
 *  9. Auto-end match if all players are eliminated
 */
export const submit = async (matchId, userId, problemId, language, sourceCode, io) => {
  // 1. Find match
  const match = await Match.findById(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // 2. Match must be live
  if (match.status !== "LIVE") throw new ApiError(400, "Match is not live");

  // 3. Find player state
  const playerState = await PlayerState.findOne({ matchId, userId });
  if (!playerState) throw new ApiError(404, "Player state not found");

  // 4. Eliminated players cannot submit
  if (!playerState.isAlive) throw new ApiError(403, "Eliminated players cannot submit");

  // 5. Create a Pending submission record immediately
  const submission = await Submission.create({
    matchId,
    userId,
    problemId,
    language,
    sourceCode,
    verdict: "Pending",
  });

  // 6. Refresh activity timestamp
  playerState.lastActiveAt = new Date();
  await playerState.save();

  // 7. Evaluate (awaits stub latency)
  const result = await evaluate(problemId, language, sourceCode);

  // 8. Persist verdict
  submission.verdict = result.verdict;
  submission.evaluatedAt = new Date();
  await submission.save();

  // 9. Apply game logic based on verdict
  if (result.verdict === "Accepted") {
    // Award points: (stageIndex + 1) * 100
    playerState.score += (playerState.currentStage + 1) * 100;

    // Advance to next stage if not already at the last one
    if (playerState.currentStage < STAGES.length - 1) {
      playerState.currentStage += 1;
      playerState.stageHistory.push({
        stage: STAGES[playerState.currentStage],
        unlockedAt: new Date(),
      });
    }

    await playerState.save();
  } else {
    // Wrong / error verdict
    playerState.wrongAttempts += 1;

    // Battle Royale elimination: 5+ wrong attempts
    if (
      match.gameMode === "BATTLE_ROYALE" &&
      playerState.wrongAttempts >= 5
    ) {
      playerState.isAlive = false;
      playerState.eliminationReason = "WRONG_ATTEMPTS";

      // Notify everyone in the room about the elimination
      io.to(match.roomId.toString()).emit("player:eliminated", {
        userId,
        reason: "WRONG_ATTEMPTS",
        matchId,
      });
    }

    await playerState.save();
  }

  // Record this submission as a replay event.
  // Wrapped in try/catch — replay recording must never crash the submission flow.
  try {
    const { recordEvent } = await import("./replay.service.js");
    const matchDoc = await Match.findById(matchId);
    if (matchDoc?.startTime) {
      await recordEvent(
        matchId,
        "submission",
        userId,
        {
          problemId,
          language,
          verdict: result.verdict,
          stage: playerState.currentStage,
        },
        matchDoc.startTime
      );
    }
  } catch (e) {
    /* replay recording must never crash submission */
  }

  // 10. Send verdict back to the submitting player's private channel
  io.to(userId.toString()).emit("submission:result", {
    submissionId: submission._id,
    verdict: result.verdict,
    playerState: {
      currentStage: playerState.currentStage,
      score: playerState.score,
      wrongAttempts: playerState.wrongAttempts,
      isAlive: playerState.isAlive,
    },
  });

  // 11. Broadcast updated scoreboard to the whole room
  await broadcastScoreboard(matchId, match.roomId.toString(), io);

  // 12. Auto-end match if every player has been eliminated
  const allPlayerStates = await PlayerState.find({ matchId });
  const allEliminated = allPlayerStates.every((ps) => !ps.isAlive);
  if (allEliminated) {
    await endMatch(matchId, io);
  }

  return submission;
};

// ---------------------------------------------------------------------------
// getSubmissionsByMatch
// ---------------------------------------------------------------------------

/**
 * Return all submissions for a match, newest first.
 * Populates userId with name and avatar.
 */
export const getSubmissionsByMatch = async (matchId) => {
  return Submission.find({ matchId })
    .sort({ submittedAt: -1 })
    .populate("userId", "name avatar");
};

// ---------------------------------------------------------------------------
// getSubmissionsByUser
// ---------------------------------------------------------------------------

/**
 * Return all submissions for a specific user within a match.
 */
export const getSubmissionsByUser = async (matchId, userId) => {
  return Submission.find({ matchId, userId }).sort({ submittedAt: -1 });
};

// getScoreboard and broadcastScoreboard are imported from scoreboard.service.js
// and re-exported here for backwards compatibility with existing consumers.
export { getScoreboard, broadcastScoreboard };
