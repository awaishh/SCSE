import { body } from "express-validator";

// Re-export runValidation so routes only need one import
export { runValidation } from "./auth.validator.js";

/**
 * Validate guild creation payload.
 * name: required, 3–30 chars
 * description: optional, max 200 chars
 */
export const validateCreateGuild = [
  body("name")
    .notEmpty()
    .withMessage("Guild name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Guild name must be between 3 and 30 characters")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters")
    .trim(),
];

/**
 * Validate join guild payload.
 * guildId: required, valid MongoDB ObjectId
 */
export const validateJoinGuild = [
  body("guildId")
    .notEmpty()
    .withMessage("guildId is required")
    .isMongoId()
    .withMessage("guildId must be a valid MongoDB ObjectId"),
];
