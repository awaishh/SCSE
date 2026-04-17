import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getRoom } from "../controllers/room.controller.js";

const router = Router();

// All room routes require authentication
router.use(verifyJWT);

// GET /api/rooms/:roomCode — read-only HTTP endpoint for initial page load / deep linking
// Create, join, and leave are handled via Socket.IO events (room:create, room:join, room:leave)
router.get("/:roomCode", getRoom);

export default router;
