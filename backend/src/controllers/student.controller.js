import * as studentService from "../services/student.service.js";
import { sendSuccess } from "../utils/response.js";

/**
 * GET /api/students/me
 * Get the current student's profile
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const student = await studentService.getStudentProfile(req.user.userId);
    return sendSuccess(res, 200, "Profile retrieved successfully", student);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/profile
 * Submit/complete student profile - locks the profile
 */
export const submitProfile = async (req, res, next) => {
  try {
    const student = await studentService.submitStudentProfile(
      req.user.userId,
      req.body
    );
    return sendSuccess(res, 200, "Profile submitted successfully. Your profile is now locked.", student);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/profile
 * Update student profile (only if not locked)
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    const student = await studentService.updateStudentProfile(
      req.user.userId,
      req.body,
      false // student cannot bypass locking
    );
    return sendSuccess(res, 200, "Profile updated successfully", student);
  } catch (error) {
    next(error);
  }
};
