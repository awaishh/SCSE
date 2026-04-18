import { Submission } from "../models/submission.model.js";
import { PlayerState } from "../models/playerState.model.js";
import { Match } from "../models/match.model.js";
import { executeCode } from "./piston.service.js";
import { getProblemWithAllTestCases, getMatchProblem } from "./problem.service.js";
import { TOTAL_QUESTIONS } from "./match.service.js";

export const submit = async (matchId, userId, problemId, language, sourceCode, io) => {
  // 1. Validate match is live
  const match = await Match.findById(matchId);
  if (!match) throw new Error("Match not found");
  if (match.status !== "LIVE") throw new Error("Match is not live");

  // 2. Get player state
  const playerState = await PlayerState.findOne({ matchId, userId });
  if (!playerState) throw new Error("Player state not found");
  if (!playerState.isAlive) throw new Error("You have been eliminated");

  // 3. Create pending submission
  const submission = await Submission.create({
    matchId,
    userId,
    problemId,
    language,
    sourceCode,
    verdict: "Pending",
  });

  // Update lastActiveAt
  playerState.lastActiveAt = new Date();
  await playerState.save();

  try {
    // 4. Fetch all test cases for this problem
    const problem = await getProblemWithAllTestCases(problemId);
    const testCases = problem.testCases || [];

    if (testCases.length === 0) {
      throw new Error("No test cases found for this problem");
    }

    let allPassed = true;
    let finalOutput = null;
    let passedCount = 0;

    // 5. Run against each test case
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await executeCode(sourceCode, language, tc.input, tc.expectedOutput);

      if (result.status.id !== 3) {
        allPassed = false;
        const verdictMap = {
          4: "Wrong_Answer",
          5: "Time_Limit_Exceeded",
          6: "Compilation_Error",
          11: "Runtime_Error",
        };
        submission.verdict = verdictMap[result.status.id] || "Wrong_Answer";
        finalOutput = {
          passed: false,
          passedCount,
          totalCount: testCases.length,
          error: result.stderr || result.compile_output || result.status.description,
          runtime: parseFloat(result.time || "0") * 1000,
          failedTestCase: tc.isHidden ? null : {
            input: tc.input,
            expected: tc.expectedOutput,
            got: result.stdout,
          },
        };
        break;
      }

      passedCount++;
      finalOutput = {
        passed: true,
        passedCount,
        totalCount: testCases.length,
        runtime: parseFloat(result.time || "0") * 1000,
      };
    }

    if (allPassed) submission.verdict = "Accepted";
    submission.evaluatedAt = new Date();
    await submission.save();

    // 6. Record in replay — store the actual source code
    try {
      const { recordEvent } = await import("./replay.service.js");
      if (match?.startTime) {
        await recordEvent(matchId, "submission", userId.toString(), {
          problemId,
          problemTitle: problem.title,
          verdict: submission.verdict,
          language,
          sourceCode, // store actual code for replay
          questionIndex: playerState.currentStage,
          runtime: finalOutput?.runtime,
        }, match.startTime);
      }
    } catch (e) { /* silent */ }

    // 7. Update game state if accepted
    if (allPassed) {
      await updateGameStateOnAccept(matchId, userId, io, match);
    } else {
      // Increment wrong attempts
      playerState.wrongAttempts += 1;
      await playerState.save();
    }

    // 8. Emit result to the submitting player
    io.to(userId.toString()).emit("submission:result", {
      userId,
      submissionId: submission._id,
      verdict: submission.verdict,
      ...finalOutput,
    });

    // Also emit to room so opponent sees scoreboard update
    const { broadcastScoreboard } = await import("./scoreboard.service.js");
    await broadcastScoreboard(matchId, match.roomId.toString(), io);

    return submission;

  } catch (error) {
    submission.verdict = "Runtime_Error";
    submission.evaluatedAt = new Date();
    await submission.save();

    io.to(userId.toString()).emit("submission:result", {
      userId,
      submissionId: submission._id,
      verdict: "Runtime_Error",
      passed: false,
      error: error.message,
    });

    throw error;
  }
};

const updateGameStateOnAccept = async (matchId, userId, io, match) => {
  const playerState = await PlayerState.findOne({ matchId, userId });
  if (!playerState) return;

  const totalQuestions = TOTAL_QUESTIONS || 3;
  const currentQ = playerState.currentStage;
  const isLastQuestion = currentQ >= totalQuestions - 1;

  // Award points and advance to next question
  playerState.score += 100;

  if (isLastQuestion) {
    // Player finished all questions — they win
    playerState.status = "FINISHED";
    playerState.finishedAt = new Date();
    await playerState.save();

    // Set winner and end match
    match.winnerIds = [userId];
    await match.save();

    const { endMatch } = await import("./match.service.js");
    await endMatch(matchId.toString(), io);
  } else {
    // Advance to next question
    playerState.currentStage = currentQ + 1;
    await playerState.save();

    // Notify the player their next question is ready
    const nextProblem = await getMatchProblem(matchId, playerState.currentStage);
    io.to(userId.toString()).emit("match:next-question", {
      questionIndex: playerState.currentStage,
      problem: nextProblem,
    });

    // Notify room that this player advanced
    io.to(match.roomId.toString()).emit("match:player-advanced", {
      userId,
      questionIndex: playerState.currentStage,
      score: playerState.score,
    });
  }
};
