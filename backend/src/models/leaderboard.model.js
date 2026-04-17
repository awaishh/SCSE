import mongoose from 'mongoose';
import { RANK_TIERS } from '../utils/rankTier.js';

// All valid leaderboard modes: the 7 game modes + a global aggregate
export const LEADERBOARD_MODES = [
  'BATTLE_ROYALE',
  'BLITZ_1V1',
  'BLITZ_3V3',
  'TEAM_DUEL_2V2',
  'TEAM_DUEL_3V3',
  'ICPC_STYLE',
  'KNOCKOUT',
  'GLOBAL',
];

const leaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // 'GLOBAL' or one of the 7 game modes
    mode: {
      type: String,
      enum: LEADERBOARD_MODES,
      required: true,
    },
    rating: {
      type: Number,
      default: 1000,
    },
    rankTier: {
      type: String,
      enum: RANK_TIERS,
      default: 'Silver',
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    matchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Enforce one entry per user per mode
leaderboardSchema.index({ userId: 1, mode: 1 }, { unique: true });

// Fast sorted leaderboard queries per mode
leaderboardSchema.index({ mode: 1, rating: -1 });

export const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
