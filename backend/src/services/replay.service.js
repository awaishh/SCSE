import { Replay } from "../models/replay.model.js";
import { ApiError } from "../utils/api-error.js";

// ---------------------------------------------------------------------------
// initReplay
// ---------------------------------------------------------------------------

/**
 * Create a new (empty, unfinalized) Replay document for a match.
 * Called when a match transitions to LIVE.
 *
 * @param {string} matchId
 * @returns {Promise<import("../models/replay.model.js").Replay>}
 */
export const initReplay = async (matchId) => {
  const replay = await Replay.create({
    matchId,
    events: [],
    isFinalized: false,
  });
  return replay;
};

// ---------------------------------------------------------------------------
// recordEvent
// ---------------------------------------------------------------------------

/**
 * Append a single event to the replay event log.
 * This function is intentionally non-throwing — replay recording must never
 * crash the main match/submission flow.
 *
 * @param {string} matchId
 * @param {string} type          - One of the allowed event type strings
 * @param {string|null} userId   - The user who triggered the event (null for system events)
 * @param {object} data          - Event-specific payload
 * @param {Date|string} matchStartTime - The match's startTime (used to compute offsetMs)
 * @returns {Promise<import("../models/replay.model.js").Replay|null>}
 */
export const recordEvent = async (matchId, type, userId, data, matchStartTime) => {
  const replay = await Replay.findOne({ matchId });

  // If no replay document exists yet, bail out silently
  if (!replay) return null;

  // Calculate how many milliseconds have elapsed since the match started
  const offsetMs = Date.now() - new Date(matchStartTime).getTime();

  replay.events.push({
    type,
    userId: userId || null,
    data,
    offsetMs,
  });

  await replay.save();
  return replay;
};

// ---------------------------------------------------------------------------
// finalizeReplay
// ---------------------------------------------------------------------------

/**
 * Mark a replay as finalized and attach the final scoreboard snapshot.
 * Called at the end of a match so the replay becomes publicly accessible.
 *
 * @param {string} matchId
 * @param {object} finalScoreboard
 * @returns {Promise<import("../models/replay.model.js").Replay>}
 */
export const finalizeReplay = async (matchId, finalScoreboard) => {
  const replay = await Replay.findOne({ matchId });

  if (!replay) return null;

  replay.isFinalized = true;
  replay.finalScoreboard = finalScoreboard;
  await replay.save();

  return replay;
};

// ---------------------------------------------------------------------------
// getReplay
// ---------------------------------------------------------------------------

/**
 * Retrieve a finalized replay for a match, with user info populated on events.
 * Throws ApiError 404 if the replay doesn't exist or hasn't been finalized yet.
 *
 * @param {string} matchId
 * @returns {Promise<import("../models/replay.model.js").Replay>}
 */
export const getReplay = async (matchId) => {
  const replay = await Replay.findOne({ matchId, isFinalized: true }).populate(
    "events.userId",
    "name avatar"
  );

  if (!replay) {
    throw new ApiError(404, "Replay not found or not yet finalized");
  }

  return replay;
};
