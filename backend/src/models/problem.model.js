import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: true },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    tags: [{ type: String }],
    description: { type: String, required: true },
    constraints: { type: String, default: "" },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    testCases: [testCaseSchema],
    // Starter code templates per language
    starterCode: {
      javascript: { type: String, default: "" },
      python: { type: String, default: "" },
      cpp: { type: String, default: "" },
      java: { type: String, default: "" },
    },
    // Difficulty rating (maps to STAGES in match.service)
    difficultyRating: { type: Number, default: 1200 },
    // Track usage
    timesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemSchema.index({ difficulty: 1, difficultyRating: 1 });

export const Problem = mongoose.model("Problem", problemSchema);
