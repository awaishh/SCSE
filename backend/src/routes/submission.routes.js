import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { submissionRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validateSubmit, runValidation } from "../validators/submission.validator.js";
import {
  submitCode,
  getMatchSubmissions,
  getUserSubmissions,
  getScoreboard,
} from "../controllers/submission.controller.js";

const router = Router();

// All submission routes require authentication
router.use(verifyJWT);

// POST /api/submissions/submit
router.post(
  "/submit",
  submissionRateLimiter,
  validateSubmit,
  runValidation,
  submitCode
);

// GET /api/submissions/match/:matchId
router.get("/match/:matchId", getMatchSubmissions);

// GET /api/submissions/match/:matchId/me
router.get("/match/:matchId/me", getUserSubmissions);

// GET /api/submissions/match/:matchId/scoreboard
router.get("/match/:matchId/scoreboard", getScoreboard);

export default router;
