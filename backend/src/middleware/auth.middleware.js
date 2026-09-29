import { verifyToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

/**
 * Authentication middleware - verifies JWT token and attaches user to req
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Authorization token is required");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(res, 401, "Authorization token is missing");
    }

    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token has expired. Please login again");
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token. Please login again");
    }
    return sendError(res, 401, "Authentication failed");
  }
};

export default authMiddleware;
