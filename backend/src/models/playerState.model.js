import mongoose from "mongoose";

const stageHistorySchema = new mongoose.Schema(
  {
    stage: { type: Number, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const playerStateSchema = new mongoose.Schema(
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
    // null for solo modes; set to a team identifier string for team modes
    teamId: {
      type: String,
      default: null,
    },
    // Index into STAGES array: 0 → 1100, 1 → 1200, …, 4 → 1500
    currentStage: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    wrongAttempts: {
      type: Number,
      default: 0,
    },
    isAlive: {
      type: Boolean,
      default: true,
    },
    eliminationReason: {
      type: String,
      enum: ["INACTIVITY", "WRONG_ATTEMPTS", "MATCH_END", null],
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    // Records when each difficulty stage was unlocked by this player
    stageHistory: [stageHistorySchema],
  },
  { timestamps: true }
);

// Enforce one PlayerState document per player per match
playerStateSchema.index({ matchId: 1, userId: 1 }, { unique: true });

export const PlayerState = mongoose.model("PlayerState", playerStateSchema);
