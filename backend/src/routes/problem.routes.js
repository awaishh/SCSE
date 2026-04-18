import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import * as problemService from "../services/problem.service.js";

const router = Router();
router.use(verifyJWT);

// GET /api/problems — list all problems
router.get("/", asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await problemService.getAllProblems(Number(page), Number(limit));
  return res.status(200).json(new ApiResponse(200, result, "Problems fetched"));
}));

// GET /api/problems/match/:matchId/question/:index — get assigned problem for a match question
router.get("/match/:matchId/question/:index", asyncHandler(async (req, res) => {
  const { matchId, index } = req.params;
  const problem = await problemService.getMatchProblem(matchId, Number(index));
  return res.status(200).json(new ApiResponse(200, { problem }, "Problem fetched"));
}));

// GET /api/problems/stage/:stage — legacy, kept for compat
router.get("/stage/:stage", asyncHandler(async (req, res) => {
  const stage = Number(req.params.stage) || 0;
  const { matchId } = req.query;
  const problem = matchId
    ? await problemService.getMatchProblem(matchId, stage)
    : await problemService.getRandomProblemForStage(stage);
  return res.status(200).json(new ApiResponse(200, { problem }, "Stage problem fetched"));
}));

// GET /api/problems/:slug — fetch by slug
router.get("/:slug", asyncHandler(async (req, res) => {
  const problem = await problemService.getProblemBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, problem, "Problem fetched"));
}));

export default router;
