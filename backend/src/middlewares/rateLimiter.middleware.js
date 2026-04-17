import rateLimit from "express-rate-limit";

// Generic rate limiter for auth routes (Login/Register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    message: "Too many attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Validation settings for v7+
  validate: { 
    trustProxy: true,
    keyGeneratorIpFallback: false 
  },
});

// Specific rate limiter for submissions or sensitive actions
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  // Primary key is User ID, fallback is IP address
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many submissions, please wait before trying again",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Validation settings for v7+
  validate: { 
    trustProxy: true,
    keyGeneratorIpFallback: false 
  },
});
