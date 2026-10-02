import { Router } from "express";
import * as tpoController from "../controllers/tpo.controller.js";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All TPO routes require authentication and CENTRAL_TPO role
router.use(authMiddleware);
router.use(requireRole("CENTRAL_TPO"));

// ============================
// Dashboard
// ============================
router.get("/dashboard", tpoController.getDashboard);

// ============================
// Students
// ============================

// GET /api/tpo/students/export - export students as CSV/XLSX
// IMPORTANT: This must be BEFORE the /students/:id route
router.get("/students/export", tpoController.exportStudents);

// GET /api/tpo/export/company-wise - export company-wise student placements
router.get("/export/company-wise", tpoController.exportCompanyWiseStudents);
router.get("/companies/export", tpoController.exportCompanyWiseStudents);

// GET /api/tpo/students - get all students (paginated + filters)
router.get("/students", tpoController.getAllStudents);

// GET /api/tpo/students/:id - get specific student
router.get("/students/:id", tpoController.getStudentById);

// PUT /api/tpo/students/:id - update student (can update locked profiles)
router.put("/students/:id", tpoController.updateStudent);

// PATCH /api/tpo/students/:id/verify - update verification status
router.patch("/students/:id/verify", tpoController.verifyStudent);

// PATCH /api/tpo/students/:id/dismiss - dismiss student from placement
router.patch("/students/:id/dismiss", tpoController.dismissStudent);

// PATCH /api/tpo/students/:id/reinstate - reinstate a dismissed student
router.patch("/students/:id/reinstate", tpoController.reinstateStudent);

// ============================
// Applications & Attendance
// ============================

// GET /api/tpo/applications - view all applications with filters
router.get("/applications", applicationController.getTpoApplications);

// PATCH /api/tpo/applications/:id/attendance - mark single attendance
router.patch("/applications/:id/attendance", applicationController.markAttendance);

// POST /api/tpo/drives/:driveId/mark-attendance - bulk mark attendance
router.post("/drives/:driveId/mark-attendance", applicationController.bulkMarkAttendance);

// GET /api/tpo/drives/:driveId/export - export drive applicants
router.get("/drives/:driveId/export", tpoController.exportDriveApplicants);

// ============================
// Email & Announcements
// ============================

// POST /api/tpo/drives/:driveId/notify - send drive notification emails
router.post("/drives/:driveId/notify", tpoController.sendDriveNotification);

// POST /api/tpo/announcements/refactor - AI refactor rough notes into styled HTML email
router.post("/announcements/refactor", tpoController.refactorAnnouncement);

// POST /api/tpo/announcements/send - send custom announcement
router.post("/announcements/send", tpoController.sendAnnouncement);

// GET /api/tpo/emails - get sent email history
router.get("/emails", tpoController.getEmailLogs);

// ============================
// Settings
// ============================

// GET /api/tpo/settings - get all settings
router.get("/settings", tpoController.getSettings);

// PATCH /api/tpo/settings - update a setting
router.patch("/settings", tpoController.updateSetting);

export default router;
