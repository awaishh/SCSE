import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  startMatch,
  endMatch,
  getMatch,
  getMatchByRoom,
} from "../controllers/match.controller.js";

const router = Router();

// All match routes require a valid JWT
router.use(verifyJWT);

// POST /api/matches/start  — host starts the match
router.post("/start", startMatch);

// POST /api/matches/end    — participant/host ends the match
router.post("/end", endMatch);

// GET  /api/matches/room/:roomId — most recent match for a room
// Must be declared before /:matchId to avoid "room" being treated as a matchId
router.get("/room/:roomId", getMatchByRoom);

// GET  /api/matches/:matchId — fetch a specific match
router.get("/:matchId", getMatch);

export default router;
