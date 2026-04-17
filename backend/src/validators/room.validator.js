import { body } from "express-validator";
import { GAME_MODES } from "../models/room.model.js";

// Re-export runValidation so routes only need one import
export { runValidation } from "./auth.validator.js";

const VALID_MODES = Object.keys(GAME_MODES);

/**
 * Validates the body for POST /api/rooms/create
 */
export const validateCreateRoom = [
  body("gameMode")
    .notEmpty()
    .withMessage("Game mode is required")
    .isIn(VALID_MODES)
    .withMessage(`Game mode must be one of: ${VALID_MODES.join(", ")}`),

  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

/**
 * Validates the body for POST /api/rooms/join
 */
export const validateJoinRoom = [
  body("roomCode")
    .notEmpty()
    .withMessage("Room code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Room code must be exactly 6 characters"),
];
