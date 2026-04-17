import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
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
    // Problem identifier (e.g. slug or numeric ID from problem bank)
    problemId: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "cpp", "java", "c"],
    },
    sourceCode: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong_Answer",
        "Time_Limit_Exceeded",
        "Runtime_Error",
        "Compilation_Error",
        "Pending",
      ],
      default: "Pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Populated once the judge returns a result
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for fast per-match and per-user-in-match queries
submissionSchema.index({ matchId: 1, userId: 1 });

export const Submission = mongoose.model("Submission", submissionSchema);
