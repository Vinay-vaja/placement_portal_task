import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/auth/register
 * Register a new student
 */
export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    return sendSuccess(res, 201, "Account created successfully", user);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return sendSuccess(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
};
