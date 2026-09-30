import * as driveService from "../services/drive.service.js";
import * as eligibilityService from "../services/eligibility.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination.js";

/**
 * GET /api/drives
 * Get all drives (paginated) with optional filters
 */
export const getDrives = async (req, res, next) => {
  try {
    const result = await driveService.getDrives(
      req.query,
      req.user?.userId,
      req.user?.role
    );
    return sendSuccess(res, 200, "Drives retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/drives/:id
 * Get a single drive by ID
 */
export const getDriveById = async (req, res, next) => {
  try {
    const drive = await driveService.getDriveById(req.params.id);
    return sendSuccess(res, 200, "Drive retrieved successfully", drive);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/drives
 * Create a new recruitment drive (TPO only)
 */
export const createDrive = async (req, res, next) => {
  try {
    const drive = await driveService.createDrive(req.body);
    return sendSuccess(res, 201, "Recruitment drive created successfully", drive);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/drives/:id
 * Update a recruitment drive (TPO only)
 */
export const updateDrive = async (req, res, next) => {
  try {
    const drive = await driveService.updateDrive(req.params.id, req.body);
    return sendSuccess(res, 200, "Recruitment drive updated successfully", drive);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/drives/:id
 * Delete a recruitment drive (TPO only)
 */
export const deleteDrive = async (req, res, next) => {
  try {
    const result = await driveService.deleteDrive(req.params.id);
    return sendSuccess(res, 200, "Recruitment drive deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/drives/:driveId/eligible-students
 * Get all eligible students for a drive (TPO only)
 */
export const getEligibleStudents = async (req, res, next) => {
  try {
    const drive = await driveService.getDriveById(req.params.driveId);
    const students = await eligibilityService.getEligibleStudents(
      drive,
      req.query
    );

    return sendSuccess(
      res,
      200,
      `Found ${students.length} eligible students`,
      {
        driveId: drive.id,
        company: drive.company,
        role: drive.role,
        eligibleCount: students.length,
        students,
      }
    );
  } catch (error) {
    next(error);
  }
};
