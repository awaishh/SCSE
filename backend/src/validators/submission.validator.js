import { body } from "express-validator";
import { SUPPORTED_LANGUAGES } from "../services/judge.service.js";

// Re-export runValidation so routes only need one import
export { runValidation } from "./auth.validator.js";

/**
 * Validation chain for POST /api/submissions/submit
 */
export const validateSubmit = [
  body("matchId")
    .notEmpty()
    .withMessage("matchId is required"),

  body("problemId")
    .notEmpty()
    .withMessage("problemId is required"),

  body("language")
    .isIn(SUPPORTED_LANGUAGES)
    .withMessage(`language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`),

  body("sourceCode")
    .notEmpty()
    .withMessage("sourceCode is required")
    .isLength({ max: 50_000 })
    .withMessage("sourceCode must not exceed 50 000 characters"),
];
