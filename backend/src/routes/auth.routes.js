import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  oauthSuccess,
  setup2FA,
  verify2FA,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/authController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import passport from "../utils/passport.js";
import { validateRegister, validateLogin, runValidation } from "../validators/auth.validator.js";

const router = Router();

// Local Auth
router.post("/register", authRateLimiter, validateRegister, runValidation, registerUser);
router.post("/login", authRateLimiter, validateLogin, runValidation, loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", verifyJWT, logoutUser);

// 2FA & Password Reset
router.post("/setup-2fa", verifyJWT, setup2FA);
router.post("/verify-2fa", verifyJWT, verify2FA);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/verify-reset-code", authRateLimiter, verifyResetCode);
router.post("/reset-password", authRateLimiter, resetPassword);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  oauthSuccess
);

// GitHub OAuth
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  oauthSuccess
);

export default router;
