import { sendError } from "../utils/response.js";

/**
 * Role-based authorization middleware factory
 * @param {...string} roles - allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role: ${roles.join(" or ")}`
      );
    }

    next();
  };
};
