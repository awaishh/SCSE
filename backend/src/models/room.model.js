import mongoose from "mongoose";

// All supported game modes and their player limits
export const GAME_MODES = {
  BATTLE_ROYALE: { min: 2, max: 8 },
  BLITZ_1V1: { min: 2, max: 2 },
  BLITZ_3V3: { min: 6, max: 6 },
  TEAM_DUEL_2V2: { min: 4, max: 4 },
  TEAM_DUEL_3V3: { min: 6, max: 6 },
  ICPC_STYLE: { min: 6, max: 6 },
  KNOCKOUT: { min: 2, max: 8 },
};

const roomSchema = new mongoose.Schema(
  {
    // Unique 6-char uppercase alphanumeric code for sharing
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z0-9]{6}$/,
    },

    // The user who created the room
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Game mode determines rules and player limits
    gameMode: {
      type: String,
      enum: Object.keys(GAME_MODES),
      required: true,
    },

    // Lifecycle state of the room
    status: {
      type: String,
      enum: ["WAITING", "COUNTDOWN", "LIVE", "FINISHED"],
      default: "WAITING",
    },

    // Players currently in the room
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        teamId: {
          type: String,
          default: null,
        },
      },
    ],

    // Derived from gameMode on creation
    maxPlayers: {
      type: Number,
      required: true,
    },

    // Private rooms require a code to join (not listed publicly)
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Generate a random 6-character uppercase alphanumeric room code
roomSchema.statics.generateRoomCode = function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const Room = mongoose.model("Room", roomSchema);
