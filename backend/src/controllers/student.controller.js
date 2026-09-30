import * as studentService from "../services/student.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { parsePagination, parseSorting, buildPaginatedResponse } from "../utils/pagination.js";

/**
 * GET /api/students/me
 * Get the authenticated student's profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const student = await studentService.getStudentProfile(req.user.userId);
    return sendSuccess(res, 200, "Profile retrieved successfully", student);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/profile
 * Submit/complete academic profile (locks the profile)
 */
export const submitProfile = async (req, res, next) => {
  try {
    const student = await studentService.submitStudentProfile(
      req.user.userId,
      req.body
    );
    return sendSuccess(
      res,
      200,
      "Profile submitted and locked successfully. It cannot be edited further.",
      student
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/complete-profile
 * Profile completion step (for Google OAuth users or step-2 after register)
 */
export const completeProfile = async (req, res, next) => {
  try {
    const student = await studentService.submitStudentProfile(
      req.user.userId,
      req.body
    );
    return sendSuccess(
      res,
      200,
      "Profile completed and locked successfully.",
      student
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/profile
 * Update profile (only allowed if NOT locked)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const student = await studentService.updateStudentProfile(
      req.user.userId,
      req.body,
      false // not TPO
    );
    return sendSuccess(res, 200, "Profile updated successfully", student);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/applications
 * Get the student's own applications (paginated)
 */
export const getApplications = async (req, res, next) => {
  try {
    const applicationService = await import("../services/application.service.js");
    const result = await applicationService.getStudentApplications(
      req.user.userId,
      req.query
    );
    return sendSuccess(res, 200, "Applications retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

// ============================
// SPI Endpoints
// ============================

/**
 * POST /api/students/spi
 * Add or update a single semester SPI
 */
export const upsertSpi = async (req, res, next) => {
  try {
    const { semester, spi } = req.body;
    const result = await studentService.upsertSpi(
      req.user.userId,
      semester,
      spi
    );
    return sendSuccess(res, 200, `SPI for semester ${semester} saved successfully`, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/spi/bulk
 * Bulk add/update SPIs
 */
export const bulkUpsertSpi = async (req, res, next) => {
  try {
    const { spis } = req.body;
    const results = await studentService.bulkUpsertSpi(req.user.userId, spis);
    return sendSuccess(res, 200, `${results.length} SPI entries saved successfully`, results);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/spi
 * Get all SPIs with computed CPI and CGPA
 */
export const getSpis = async (req, res, next) => {
  try {
    const result = await studentService.getStudentSpis(req.user.userId);
    return sendSuccess(res, 200, "SPI data retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};
