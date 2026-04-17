import mongoose from "mongoose";
import { GAME_MODES } from "./room.model.js";

const matchSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    gameMode: {
      type: String,
      enum: Object.keys(GAME_MODES),
      required: true,
    },
    // State machine: WAITING → COUNTDOWN → LIVE → FINISHED
    status: {
      type: String,
      enum: ["WAITING", "COUNTDOWN", "LIVE", "FINISHED"],
      default: "WAITING",
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    winnerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    // Stores tournament bracket for KNOCKOUT mode
    bracketData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export const Match = mongoose.model("Match", matchSchema);
