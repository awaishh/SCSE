import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  joinSpectate,
  leaveSpectate,
  getSpectators,
  getLiveMatches,
} from "../controllers/spectator.controller.js";

const router = Router();

// All spectator routes require authentication
router.use(verifyJWT);

// GET  /api/spectator/live  — list all live matches available for spectating
router.get("/live", getLiveMatches);

// POST /api/spectator/join  — start spectating a live match
router.post("/join", joinSpectate);

// POST /api/spectator/leave — stop spectating a match
router.post("/leave", leaveSpectate);

// GET  /api/spectator/:matchId — list current spectators for a match
router.get("/:matchId", getSpectators);

export default router;
