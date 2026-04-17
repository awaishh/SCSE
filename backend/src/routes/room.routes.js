import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createRoom, joinRoom, leaveRoom, getRoom } from "../controllers/room.controller.js";
import {
  validateCreateRoom,
  validateJoinRoom,
  runValidation,
} from "../validators/room.validator.js";

const router = Router();

// All room routes require authentication
router.use(verifyJWT);

// Create a new room
router.post("/create", validateCreateRoom, runValidation, createRoom);

// Join an existing room by code
router.post("/join", validateJoinRoom, runValidation, joinRoom);

// Leave a room
router.post("/leave", leaveRoom);

// Get room details by short code
router.get("/:roomCode", getRoom);

export default router;
