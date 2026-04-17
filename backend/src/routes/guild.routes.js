import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createGuild,
  joinGuild,
  leaveGuild,
  getGuild,
  getGuildLeaderboard,
} from "../controllers/guild.controller.js";
import {
  validateCreateGuild,
  validateJoinGuild,
  runValidation,
} from "../validators/guild.validator.js";

const router = Router();

// Public
router.get("/leaderboard", getGuildLeaderboard);

// Authenticated
router.post("/create", verifyJWT, validateCreateGuild, runValidation, createGuild);
router.post("/join", verifyJWT, validateJoinGuild, runValidation, joinGuild);
router.post("/leave", verifyJWT, leaveGuild);
router.get("/:guildId", verifyJWT, getGuild);

export default router;
