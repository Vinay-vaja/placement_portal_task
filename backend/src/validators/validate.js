import { z } from "zod";
import { sendError } from "../utils/response.js";

/**
 * Creates an Express middleware from a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate req.body against
 * @returns Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        // Zod v4 uses .issues, v3 uses .errors
        const issues = result.error?.issues || result.error?.errors || [];
        const errors = issues.map((e) => ({
          field: (e.path || []).join(".") || "unknown",
          message: e.message,
        }));
        return sendError(res, 400, "Validation failed", errors);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
