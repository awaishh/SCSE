import { Submission } from "../models/submission.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Match } from "../models/match.model.js";
import { executeCode } from "./judge.service.js";
import { getProblemWithAllTestCases } from "./problem.service.js";
import { STAGES } from "./match.service.js";

export const submit = async (matchId, userId, problemId, language, sourceCode, io) => {
  // 1. Create a Pending Submission
  const submission = await Submission.create({
    matchId,
    userId,
    problemId,
    language,
    sourceCode,
    verdict: "Pending",
  });

  // Update lastActiveAt so player doesn't get eliminated for inactivity
  await PlayerState.findOneAndUpdate(
    { matchId, userId },
    { $set: { lastActiveAt: new Date() } }
  );

  try {
    // 2. Fetch real test cases from the Problem Bank
    const problem = await getProblemWithAllTestCases(problemId);
    const testCases = problem.testCases;

    if (!testCases || testCases.length === 0) {
      throw new Error("No test cases found for this problem");
    }

    let allPassed = true;
    let finalOutput = null;
    let passedCount = 0;

    // 3. Execute code against every test case via Judge0
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await executeCode(sourceCode, language, tc.input, tc.expectedOutput);

      // Judge0 status.id == 3 means "Accepted"
      if (result.status.id !== 3) {
        allPassed = false;
        // Map Judge0 status to our verdict enum
        const verdictMap = {
          4: "Wrong_Answer",
          5: "Time_Limit_Exceeded",
          6: "Compilation_Error",
          11: "Runtime_Error",
          12: "Runtime_Error",
        };
        submission.verdict = verdictMap[result.status.id] || "Runtime_Error";
        finalOutput = {
          passed: false,
          passedCount,
          totalCount: testCases.length,
          error: result.stderr || result.compile_output || result.status.description,
          runtime: parseFloat(result.time || "0") * 1000,
          memory: parseFloat(result.memory || "0"),
          failedTestCase: tc.isHidden ? null : { input: tc.input, expected: tc.expectedOutput, got: result.stdout },
        };
        break;
      }

      passedCount++;
      finalOutput = {
        passed: true,
        passedCount,
        totalCount: testCases.length,
        runtime: parseFloat(result.time || "0") * 1000,
        memory: parseFloat(result.memory || "0"),
      };
    }

    if (allPassed) {
      submission.verdict = "Accepted";
    }

    submission.evaluatedAt = new Date();
    await submission.save();

    // 4. Record submission event in replay
    try {
      const match = await Match.findById(matchId);
      if (match?.startTime) {
        const { recordEvent } = await import("./replay.service.js");
        await recordEvent(matchId, "SUBMISSION", userId.toString(), {
          problemId,
          verdict: submission.verdict,
          language,
          runtime: finalOutput?.runtime,
        }, match.startTime);
      }
    } catch (e) { /* silent */ }

    // 5. Update Game State if Accepted
    if (allPassed) {
      await updateGameStateOnAccept(matchId, userId, io);
    }

    // 6. Broadcast result to the match room
    const match = await Match.findById(matchId);
    if (match) {
      io.to(match.roomId.toString()).emit("submission:result", {
        userId,
        submissionId: submission._id,
        verdict: submission.verdict,
        ...finalOutput,
      });

      // Broadcast updated scoreboard
      const { broadcastScoreboard } = await import("./scoreboard.service.js");
      await broadcastScoreboard(matchId, match.roomId.toString(), io);
    }

    return submission;

  } catch (error) {
    submission.verdict = "Runtime_Error";
    submission.evaluatedAt = new Date();
    await submission.save();
    throw error;
  }
};

const updateGameStateOnAccept = async (matchId, userId, io) => {
  const match = await Match.findById(matchId);
  const playerState = await PlayerState.findOne({ matchId, userId });

  if (!match || !playerState) return;

  const finalStageIndex = Math.max(0, STAGES.length - 1);
  const solvedFinalStage = playerState.currentStage >= finalStageIndex;

  // Increment score and advance stage
  playerState.score += 100;
  if (!solvedFinalStage) {
    playerState.currentStage = Math.min(playerState.currentStage + 1, finalStageIndex);
  }
  await playerState.save();

  // First player to finish all stages wins immediately in every mode.
  if (solvedFinalStage) {
    playerState.status = "FINISHED";
    playerState.finishedAt = new Date();
    await playerState.save();

    const { endMatch } = await import("./match.service.js");
    match.winnerIds = [userId];
    await match.save();
    await endMatch(matchId.toString(), io);
  } else {
    io.to(match.roomId.toString()).emit("match:player-finished", { userId });
  }
};
