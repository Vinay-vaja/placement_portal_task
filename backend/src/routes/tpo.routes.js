import { Router } from "express";
import * as tpoController from "../controllers/tpo.controller.js";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All TPO routes require authentication and CENTRAL_TPO role
router.use(authMiddleware);
router.use(requireRole("CENTRAL_TPO"));

// GET /api/tpo/students - get all students
router.get("/students", tpoController.getAllStudents);

// GET /api/tpo/students/:id - get specific student
router.get("/students/:id", tpoController.getStudentById);

// PUT /api/tpo/students/:id - update student (can update locked profiles)
router.put("/students/:id", tpoController.updateStudent);

// PATCH /api/tpo/students/:id/verify - update verification status
router.patch("/students/:id/verify", tpoController.verifyStudent);

// GET /api/tpo/applications - view all applications with optional filters
router.get("/applications", applicationController.getTpoApplications);

export default router;
