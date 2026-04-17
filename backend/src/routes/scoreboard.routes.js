import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getMatchScoreboard,
  getMatchTeamScoreboard,
} from "../controllers/scoreboard.controller.js";

const router = Router();

// All scoreboard routes require authentication
router.use(verifyJWT);

// GET /api/scoreboard/:matchId
router.get("/:matchId", getMatchScoreboard);

// GET /api/scoreboard/:matchId/teams
router.get("/:matchId/teams", getMatchTeamScoreboard);

export default router;
