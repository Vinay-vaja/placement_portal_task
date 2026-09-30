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

/**
 * POST /api/auth/forgot-password
 * Send 6-digit OTP to user's email
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, "Email address is required");
    }
    const result = await authService.requestPasswordReset(email);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify 6-digit OTP and return reset token
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 400, "Email and OTP verification code are required");
    }
    const result = await authService.verifyPasswordResetOtp(email, otp);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Set new password using verified reset token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return sendError(res, 400, "Email, reset token, and new password are required");
    }
    const result = await authService.resetPasswordWithToken({
      email,
      resetToken,
      newPassword,
    });
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};
