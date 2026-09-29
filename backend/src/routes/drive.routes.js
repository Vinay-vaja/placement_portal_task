import { Router } from "express";
import * as driveController from "../controllers/drive.controller.js";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../validators/validate.js";
import {
  createDriveSchema,
  updateDriveSchema,
} from "../validators/drive.validator.js";

const router = Router();

// All drive routes require authentication
router.use(authMiddleware);

// GET /api/drives - all authenticated users can view drives
router.get("/", driveController.getDrives);

// GET /api/drives/:id - all authenticated users can view a drive
router.get("/:id", driveController.getDriveById);

// POST /api/drives - TPO only
router.post(
  "/",
  requireRole("CENTRAL_TPO"),
  validate(createDriveSchema),
  driveController.createDrive
);

// PUT /api/drives/:id - TPO only
router.put(
  "/:id",
  requireRole("CENTRAL_TPO"),
  validate(updateDriveSchema),
  driveController.updateDrive
);

// DELETE /api/drives/:id - TPO only
router.delete("/:id", requireRole("CENTRAL_TPO"), driveController.deleteDrive);

// GET /api/drives/:driveId/eligible-students - TPO only
router.get(
  "/:driveId/eligible-students",
  requireRole("CENTRAL_TPO"),
  driveController.getEligibleStudents
);

// POST /api/drives/:driveId/apply - STUDENT only
router.post(
  "/:driveId/apply",
  requireRole("STUDENT"),
  applicationController.applyToDrive
);

export default router;
