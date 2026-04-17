import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getReplay } from "../controllers/replay.controller.js";

const router = Router();

// All replay routes require authentication
router.use(verifyJWT);

// GET /api/replay/:matchId — fetch the finalized replay for a match
router.get("/:matchId", getReplay);

export default router;
