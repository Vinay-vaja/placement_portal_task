import * as studentService from "../services/student.service.js";
import * as dashboardService from "../services/dashboard.service.js";
import * as emailService from "../services/email.service.js";
import * as exportService from "../services/export.service.js";
import * as aiService from "../services/ai.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { parsePagination, parseSorting, buildPaginatedResponse } from "../utils/pagination.js";

/**
 * GET /api/tpo/students
 * Get all students with advanced filtering, search, and pagination
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const filters = {
      verificationStatus: req.query.verificationStatus,
      studentType: req.query.studentType,
      profileLocked: req.query.profileLocked,
      branch: req.query.branch,
      minTenth: req.query.minTenth,
      minTwelfth: req.query.minTwelfth,
      minCpi: req.query.minCpi,
      minCgpa: req.query.minCgpa,
      isPlaced: req.query.isPlaced,
      isDismissed: req.query.isDismissed,
      search: req.query.search,
    };

    const { skip, take, page, limit } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, [
      "createdAt",
      "fullName",
      "tenthPercentage",
      "twelfthPercentage",
      "branch",
    ]);

    const { students, total } = await studentService.getAllStudents(filters, {
      skip,
      take,
      orderBy,
    });

    const result = buildPaginatedResponse(students, total, page, limit);
    return sendSuccess(res, 200, "Students retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tpo/students/:id
 * Get a specific student
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
    const rawStatus = req.body.verificationStatus || req.body.status;
    const verificationStatus = rawStatus ? String(rawStatus).toUpperCase().trim() : null;

    if (!["PENDING", "VERIFIED", "REJECTED"].includes(verificationStatus)) {
      return sendError(res, 400, "Invalid verification status. Must be PENDING, VERIFIED, or REJECTED");
    }

    const student = await studentService.verifyStudent(
      req.params.id,
      verificationStatus,
      req.body.rejectionReason
    );
    return sendSuccess(
      res,
      200,
      `Student verification status updated to ${verificationStatus}`,
      student
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tpo/students/:id/dismiss
 * Dismiss a student from placement process
 */
export const dismissStudent = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const student = await studentService.updateStudentById(req.params.id, {
      isDismissed: true,
      dismissalReason: reason || "Dismissed by TPO",
    });

    return sendSuccess(res, 200, "Student dismissed from placement process", student);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tpo/students/:id/reinstate
 * Reinstate a dismissed student
 */
export const reinstateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudentById(req.params.id, {
      isDismissed: false,
      dismissalReason: null,
    });

    return sendSuccess(res, 200, "Student reinstated to placement process", student);
  } catch (error) {
    next(error);
  }
};

// ============================
// Dashboard
// ============================

/**
 * GET /api/tpo/dashboard
 * Comprehensive analytics dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return sendSuccess(res, 200, "Dashboard data retrieved successfully", stats);
  } catch (error) {
    next(error);
  }
};

// ============================
// Email & Announcements
// ============================

/**
 * POST /api/tpo/drives/:driveId/notify
 * Send drive notification emails to eligible students
 */
export const sendDriveNotification = async (req, res, next) => {
  try {
    const customMessage = req.body?.customMessage || "";
    const target = req.body?.target || req.query?.target || "APPLICANTS";
    const result = await emailService.sendDriveNotification(
      req.params.driveId,
      customMessage,
      target
    );
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tpo/announcements/refactor
 * Refactor rough TPO notes into styled HTML email using Groq AI
 */
export const refactorAnnouncement = async (req, res, next) => {
  try {
    const { rawNotes, templatePreset, customApiKey, customModel, model } = req.body;
    if (!rawNotes || !rawNotes.trim()) {
      return sendError(res, 400, "Notes text is required for AI refactoring");
    }

    const result = await aiService.refactorAnnouncementWithGroq({
      rawNotes,
      templatePreset,
      customApiKey,
      customModel: customModel || model,
    });

    return sendSuccess(res, 200, "Announcement refactored successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tpo/announcements/send
 * Send custom announcement email to filtered students
 */
export const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, body, driveId, ...filters } = req.body;

    if (!title || !body) {
      return sendError(res, 400, "Title and body are required for announcements");
    }

    const result = await emailService.sendCustomAnnouncement({
      title,
      body,
      driveId,
      sentById: req.user.userId,
      filters,
    });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tpo/emails
 * Get sent email history
 */
export const getEmailLogs = async (req, res, next) => {
  try {
    const result = await emailService.getEmailLogs(req.query);
    return sendSuccess(res, 200, "Email logs retrieved successfully", {
      logs: result.logs,
      data: result.logs,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
};

// ============================
// Export
// ============================

/**
 * GET /api/tpo/students/export
 * Export students as CSV or XLSX
 */
export const exportStudents = async (req, res, next) => {
  try {
    const format = req.query.format === "xlsx" ? "xlsx" : "csv";
    const buffer = await exportService.exportStudents(req.query, format);

    const contentType =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv";

    const filename = `students_export_${new Date().toISOString().split("T")[0]}.${format}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tpo/drives/:driveId/export
 * Export applicants for a specific drive
 */
export const exportDriveApplicants = async (req, res, next) => {
  try {
    const format = req.query.format === "xlsx" ? "xlsx" : "csv";
    const buffer = await exportService.exportDriveApplicants(
      req.params.driveId,
      format
    );

    const filename = `drive_applicants_${req.params.driveId}_${new Date().toISOString().split("T")[0]}.${format}`;

    const contentType =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

// ============================
// TPO Settings
// ============================

/**
 * GET /api/tpo/settings
 * Get all TPO settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const { default: prisma } = await import("../config/prisma.js");
    const settings = await prisma.tpoSetting.findMany();
    const settingsMap = {};
    settings.forEach((s) => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });
    return sendSuccess(res, 200, "Settings retrieved", settingsMap);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tpo/settings
 * Update a TPO setting
 */
export const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return sendError(res, 400, "Setting key is required");
    }

    const { default: prisma } = await import("../config/prisma.js");
    const setting = await prisma.tpoSetting.upsert({
      where: { key },
      update: { value: typeof value === "string" ? value : JSON.stringify(value) },
      create: { key, value: typeof value === "string" ? value : JSON.stringify(value) },
    });

    return sendSuccess(res, 200, `Setting "${key}" updated`, setting);
  } catch (error) {
    next(error);
  }
};
