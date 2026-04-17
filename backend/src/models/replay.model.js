import mongoose from "mongoose";

/**
 * Replay model — stores a time-ordered event log for a finished match.
 * One replay document per match (enforced by unique index on matchId).
 * TTL index automatically removes replays after 30 days.
 */
const replayEventSchema = new mongoose.Schema(
  {
    // Event type discriminator
    type: {
      type: String,
      enum: [
        "submission",
        "stage_advance",
        "elimination",
        "scoreboard_snapshot",
        "match_start",
        "match_end",
      ],
      required: true,
    },
    // The user who triggered this event (null for system events)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Event-specific payload (flexible shape per event type)
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Milliseconds elapsed since match.startTime when this event occurred
    offsetMs: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // sub-documents don't need their own _id
);

const replaySchema = new mongoose.Schema(
  {
    // One replay per match
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      unique: true,
    },
    // Ordered list of match events
    events: {
      type: [replayEventSchema],
      default: [],
    },
    // Snapshot of the final scoreboard at match end
    finalScoreboard: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Only true once endMatch has called finalizeReplay
    isFinalized: {
      type: Boolean,
      default: false,
    },
    // Used by the TTL index — documents expire 30 days after creation
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB will automatically delete replay documents 30 days after createdAt
replaySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Replay = mongoose.model("Replay", replaySchema);
