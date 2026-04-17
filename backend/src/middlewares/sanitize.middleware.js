/**
 * Recursively checks an object for keys that start with '$'
 * which are used in NoSQL injection attacks (e.g. $where, $gt).
 */
const hasDangerousKeys = (obj) => {
  if (typeof obj !== "object" || obj === null) return false;

  for (const key of Object.keys(obj)) {
    // Keys starting with '$' are MongoDB operators — reject them
    if (key.startsWith("$")) return true;

    // Recurse into nested objects/arrays
    if (typeof obj[key] === "object" && hasDangerousKeys(obj[key])) return true;
  }

  return false;
};

// Middleware: block requests containing NoSQL injection patterns
export const sanitizeInput = (req, res, next) => {
  if (
    hasDangerousKeys(req.body) ||
    hasDangerousKeys(req.query) ||
    hasDangerousKeys(req.params)
  ) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid input",
    });
  }

  next();
};
