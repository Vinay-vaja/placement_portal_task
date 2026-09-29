import { sendError } from "../utils/response.js";

/**
 * 404 Not Found middleware
 * Must be mounted after all routes
 */
const notFoundMiddleware = (req, res) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export default notFoundMiddleware;
