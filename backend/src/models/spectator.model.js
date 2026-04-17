import mongoose from "mongoose";

/**
 * Spectator model — lightweight record tracking who is currently watching a live match.
 * Compound unique index on { matchId, userId } prevents duplicate spectator entries.
 */
const spectatorSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // When the user joined as a spectator
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent the same user from appearing twice as a spectator for the same match
spectatorSchema.index({ matchId: 1, userId: 1 }, { unique: true });

export const Spectator = mongoose.model("Spectator", spectatorSchema);
