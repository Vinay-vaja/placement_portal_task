import { verifyToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

/**
 * Authentication middleware - verifies JWT token and attaches user to req
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return sendError(res, 401, "Authorization token is required");
    }

    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId || decoded.id,
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
