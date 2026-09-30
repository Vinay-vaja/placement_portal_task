import { Router } from "express";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

// PATCH /api/applications/:id/status - TPO only (update application status)
router.patch(
  "/:id/status",
  requireRole("CENTRAL_TPO"),
  applicationController.updateApplicationStatus
);

export default router;
