import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCodeforcesProblems,
  getCodeforcesProblem,
  getCodeforcesForStage,
  browseCodeforces,
} from "../controllers/problem.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import * as problemService from "../services/problem.service.js";

const router = Router();

router.use(verifyJWT);

// ── Codeforces API Routes ──
router.get("/codeforces", getCodeforcesProblems);
router.get("/codeforces/browse", browseCodeforces);
router.get("/codeforces/stage/:stage", getCodeforcesForStage);
router.get("/codeforces/:contestId/:index", getCodeforcesProblem);

// ── Local Problem Bank Routes (fallback) ──
router.get("/", asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await problemService.getAllProblems(Number(page), Number(limit));
  return res.status(200).json(new ApiResponse(200, result, "Problems fetched"));
}));

router.get("/:slug", asyncHandler(async (req, res) => {
  const problem = await problemService.getProblemBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, problem, "Problem fetched"));
}));

export default router;
