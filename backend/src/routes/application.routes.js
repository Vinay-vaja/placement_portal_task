import { Router } from "express";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../validators/validate.js";
import { updateStatusSchema } from "../validators/application.validator.js";

const router = Router();

// PATCH /api/applications/:id/status - TPO only can update status
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("CENTRAL_TPO"),
  validate(updateStatusSchema),
  applicationController.updateApplicationStatus
);

export default router;
