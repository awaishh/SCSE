import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  message: {
    message: "Too many attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for code submissions: 20 per minute per user (falls back to IP)
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  // Use authenticated user ID when available, otherwise fall back to IP
  keyGenerator: (req) => (req.user?._id ? String(req.user._id) : req.ip),
  message: {
    success: false,
    statusCode: 429,
    message: "Too many submissions, please wait before trying again",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
