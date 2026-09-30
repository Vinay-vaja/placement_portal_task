import * as applicationService from "../services/application.service.js";
import * as emailService from "../services/email.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/drives/:driveId/apply
 * Student applies to a recruitment drive (with resume PDF + terms)
 */
export const applyToDrive = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const termsAccepted = req.body.termsAccepted === "true" || req.body.termsAccepted === true;
    const resumeBuffer = req.file?.buffer || null;

    const application = await applicationService.applyToDrive(
      req.user.userId,
      driveId,
      {
        termsAccepted,
        resumeBuffer,
      }
    );

    return sendSuccess(res, 201, "Application submitted successfully", application);
  } catch (error) {
    // Attach eligibility reasons if present
    if (error.reasons) {
      return sendError(res, error.statusCode || 403, error.message, error.reasons);
    }
    next(error);
  }
};

/**
 * GET /api/tpo/applications
 * Get all applications (TPO view with filtering and pagination)
 */
export const getTpoApplications = async (req, res, next) => {
  try {
    const result = await applicationService.getTpoApplications(req.query);
    return sendSuccess(res, 200, "Applications retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/applications/:id/status
 * Update application status (TPO only)
 * Also sends status email to the student
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["APPLIED", "SHORTLISTED", "REJECTED", "SELECTED"].includes(status)) {
      return sendError(
        res,
        400,
        "Invalid status. Must be APPLIED, SHORTLISTED, REJECTED, or SELECTED"
      );
    }

    const application = await applicationService.updateApplicationStatus(
      req.params.id,
      status
    );

    // Send email notification for status changes (async, don't block response)
    if (["SHORTLISTED", "SELECTED", "REJECTED"].includes(status)) {
      emailService.sendStatusEmail(req.params.id).catch((err) => {
        console.error("[EMAIL] Failed to send status email:", err.message);
      });
    }

    return sendSuccess(
      res,
      200,
      `Application status updated to ${status}`,
      application
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tpo/applications/:id/attendance
 * Mark attendance for a single application
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { isPresent } = req.body;

    if (typeof isPresent !== "boolean") {
      return sendError(res, 400, "isPresent must be a boolean (true/false)");
    }

    const result = await applicationService.markAttendance(
      req.params.id,
      isPresent
    );

    const message = isPresent
      ? "Attendance marked: Present"
      : "Attendance marked: Absent. Student dismissed from placement.";

    return sendSuccess(res, 200, message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tpo/drives/:driveId/mark-attendance
 * Bulk mark attendance for a drive
 */
export const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { studentIds, isPresent } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return sendError(res, 400, "studentIds array is required");
    }
    if (typeof isPresent !== "boolean") {
      return sendError(res, 400, "isPresent must be a boolean (true/false)");
    }

    const result = await applicationService.bulkMarkAttendance(
      req.params.driveId,
      studentIds,
      isPresent
    );

    return sendSuccess(
      res,
      200,
      `Attendance marked for ${result.updated} students`,
      result
    );
  } catch (error) {
    next(error);
  }
};
