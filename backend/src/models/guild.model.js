import mongoose from "mongoose";

const guildMemberSchema = new mongoose.Schema(
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
  },
  { _id: false }
);

const guildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Guild name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Guild name must be at least 3 characters"],
      maxlength: [30, "Guild name must be at most 30 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description must be at most 200 characters"],
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [guildMemberSchema],
    guildRating: {
      type: Number,
      default: 0,
    },
    maxMembers: {
      type: Number,
      default: 50,
    },
  },
  { timestamps: true }
);

// Index on name for query performance (unique constraint already creates one,
// but being explicit keeps intent clear)
guildSchema.index({ name: 1 });
guildSchema.index({ guildRating: -1 }); // for leaderboard queries

export const Guild = mongoose.model("Guild", guildSchema);
