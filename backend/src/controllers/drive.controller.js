import * as driveService from "../services/drive.service.js";
import * as eligibilityService from "../services/eligibility.service.js";
import { sendSuccess } from "../utils/response.js";

/**
 * POST /api/drives
 * Create a recruitment drive (TPO only)
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
 * GET /api/drives
 * Get all recruitment drives
 */
export const getDrives = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      companyId: req.query.companyId,
    };
    const drives = await driveService.getDrives(filters);
    return sendSuccess(res, 200, "Recruitment drives retrieved successfully", drives);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/drives/:id
 * Get a single recruitment drive
 */
export const getDriveById = async (req, res, next) => {
  try {
    const drive = await driveService.getDriveById(req.params.id);
    return sendSuccess(res, 200, "Recruitment drive retrieved successfully", drive);
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
    await driveService.deleteDrive(req.params.id);
    return sendSuccess(res, 200, "Recruitment drive deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/drives/:driveId/eligible-students
 * Get eligible students for a specific drive (TPO only)
 */
export const getEligibleStudents = async (req, res, next) => {
  try {
    const drive = await driveService.getDriveById(req.params.driveId);
    const filters = {
      verificationStatus: req.query.verificationStatus,
      studentType: req.query.studentType,
      minTenth: req.query.minTenth,
      minCgpa: req.query.minCgpa,
    };
    const students = await eligibilityService.getEligibleStudents(drive, filters);
    return sendSuccess(
      res,
      200,
      `Found ${students.length} eligible student(s) for this drive`,
      students
    );
  } catch (error) {
    next(error);
  }
};
