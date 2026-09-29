import * as applicationService from "../services/application.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/drives/:driveId/apply
 * Student applies to a recruitment drive
 */
export const applyToDrive = async (req, res, next) => {
  try {
    const application = await applicationService.applyToDrive(
      req.user.userId,
      req.params.driveId
    );
    return sendSuccess(res, 201, "Application submitted successfully", application);
  } catch (error) {
    // Surface eligibility reasons if they exist
    if (error.reasons) {
      return sendError(res, error.statusCode || 403, error.message, error.reasons);
    }
    next(error);
  }
};

/**
 * GET /api/students/applications
 * Student views their own applications
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getStudentApplications(
      req.user.userId
    );
    return sendSuccess(res, 200, "Applications retrieved successfully", applications);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tpo/applications
 * TPO views all applications (with optional filters)
 */
export const getTpoApplications = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      driveId: req.query.driveId,
      companyId: req.query.companyId,
    };
    const applications = await applicationService.getTpoApplications(filters);
    return sendSuccess(res, 200, "Applications retrieved successfully", applications);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/applications/:id/status
 * TPO updates application status
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await applicationService.updateApplicationStatus(
      req.params.id,
      status
    );
    return sendSuccess(res, 200, `Application status updated to ${status}`, application);
  } catch (error) {
    next(error);
  }
};
