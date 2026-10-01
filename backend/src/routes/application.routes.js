import { Router } from "express";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

// GET /api/applications/:id/resume - View application resume PDF (Student owner or CENTRAL_TPO)
router.get("/:id/resume", applicationController.getResume);

// PATCH /api/applications/:id/status - TPO only (update application status)
router.patch(
  "/:id/status",
  requireRole("CENTRAL_TPO"),
  applicationController.updateApplicationStatus
);

export default router;
