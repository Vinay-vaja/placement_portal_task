import { sendError } from "../utils/response.js";

/**
 * Global error handling middleware
 * Must be mounted LAST in Express middleware chain
 */
const errorMiddleware = (err, req, res, next) => {
  console.error("[ERROR]", err);

  // Zod validation errors (Zod v4 uses .issues, v3 uses .errors)
  if (err.name === "ZodError" || err.issues) {
    const issues = err.issues || err.errors || [];
    const errors = issues.map((e) => ({
      field: (e.path || []).join(".") || "unknown",
      message: e.message,
    }));
    return sendError(res, 400, "Validation failed", errors);
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large. Maximum allowed size exceeded.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
    };
    return sendError(res, 400, messages[err.code] || "File upload error");
  }

  // Prisma known request errors
  if (err.code) {
    switch (err.code) {
      case "P2002": {
        // Unique constraint violation
        const field = err.meta?.target?.[0] || "field";
        return sendError(res, 409, `A record with this ${field} already exists`);
      }
      case "P2025":
        // Record not found
        return sendError(res, 404, err.meta?.cause || "Record not found");
      case "P2003":
        // Foreign key constraint
        return sendError(res, 400, "Referenced record does not exist");
      case "P2014":
        return sendError(res, 400, "Invalid relation data provided");
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, 401, "Invalid token");
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, 401, "Token expired");
  }

  // Custom application errors with a statusCode
  if (err.statusCode) {
    // Include eligibility reasons if present (from eligibility check failures)
    const errors = err.reasons || [];
    return sendError(res, err.statusCode, err.message, errors);
  }

  // Generic server error - never expose internals
  return sendError(res, 500, "Internal server error");
};

export default errorMiddleware;
