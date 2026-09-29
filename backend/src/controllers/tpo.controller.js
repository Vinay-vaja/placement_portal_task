import * as studentService from "../services/student.service.js";
import { sendSuccess } from "../utils/response.js";

/**
 * GET /api/tpo/students
 * Get all students (TPO only)
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const filters = {
      verificationStatus: req.query.verificationStatus,
      studentType: req.query.studentType,
      profileLocked: req.query.profileLocked,
    };
    const students = await studentService.getAllStudents(filters);
    return sendSuccess(res, 200, "Students retrieved successfully", students);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tpo/students/:id
 * Get a specific student (TPO only)
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    return sendSuccess(res, 200, "Student retrieved successfully", student);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tpo/students/:id
 * Update a student profile (TPO can update locked profiles)
 */
export const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudentById(
      req.params.id,
      req.body
    );
    return sendSuccess(res, 200, "Student profile updated successfully", student);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tpo/students/:id/verify
 * Update student verification status
 */
export const verifyStudent = async (req, res, next) => {
  try {
    const { verificationStatus } = req.body;

    if (!["PENDING", "VERIFIED", "REJECTED"].includes(verificationStatus)) {
      return sendSuccess(res, 400, "Invalid verification status");
    }

    const student = await studentService.verifyStudent(
      req.params.id,
      verificationStatus
    );
    return sendSuccess(res, 200, `Student verification status updated to ${verificationStatus}`, student);
  } catch (error) {
    next(error);
  }
};
