import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import * as applicationController from "../controllers/application.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../validators/validate.js";
import {
  profileSubmitSchema,
  profileUpdateSchema,
} from "../validators/student.validator.js";

const router = Router();

// All student routes require authentication and STUDENT role
router.use(authMiddleware);
router.use(requireRole("STUDENT"));

// GET /api/students/me - get current student's profile
router.get("/me", studentController.getMyProfile);

// POST /api/students/profile - submit profile (locks it)
router.post(
  "/profile",
  validate(profileSubmitSchema),
  studentController.submitProfile
);

// PUT /api/students/profile - update profile (only if not locked)
router.put(
  "/profile",
  validate(profileUpdateSchema),
  studentController.updateMyProfile
);

// GET /api/students/applications - view own applications
router.get("/applications", applicationController.getMyApplications);

export default router;
