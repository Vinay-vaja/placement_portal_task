import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/auth/register
 * Register a new student (email + password)
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return sendSuccess(res, 201, "Account created successfully. Please complete your profile.", result);
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

/**
 * POST /api/auth/google
 * Authenticate with Google OAuth token
 */
export const googleAuth = async (req, res, next) => {
  try {
    const result = await authService.googleAuth(req.body.idToken);

    const message = result.isNewUser
      ? "Google sign-in successful. Please complete your profile."
      : result.profileComplete
        ? "Google login successful"
        : "Google login successful. Please complete your profile.";

    return sendSuccess(res, result.isNewUser ? 201 : 200, message, result);
  } catch (error) {
    next(error);
  }
};
