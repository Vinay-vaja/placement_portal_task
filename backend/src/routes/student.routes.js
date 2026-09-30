import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../validators/validate.js";
import {
  profileSubmitSchema,
  profileUpdateSchema,
  spiSubmitSchema,
  spiBulkSubmitSchema,
} from "../validators/student.validator.js";
import { completeProfileSchema } from "../validators/auth.validator.js";

const router = Router();

// All student routes require authentication and STUDENT role
router.use(authMiddleware);
router.use(requireRole("STUDENT"));

// GET /api/students/me - get own profile
router.get("/me", studentController.getProfile);

// POST /api/students/profile - submit full profile (locks it)
router.post(
  "/profile",
  validate(profileSubmitSchema),
  studentController.submitProfile
);

// POST /api/students/complete-profile - complete profile after Google auth
router.post(
  "/complete-profile",
  validate(completeProfileSchema),
  studentController.completeProfile
);

// PUT /api/students/profile - update profile (only if not locked)
router.put(
  "/profile",
  validate(profileUpdateSchema),
  studentController.updateProfile
);

// GET /api/students/applications - get own applications (paginated)
router.get("/applications", studentController.getApplications);

// ============================
// SPI Routes
// ============================

// POST /api/students/spi - add/update single semester SPI
router.post("/spi", validate(spiSubmitSchema), studentController.upsertSpi);

// POST /api/students/spi/bulk - bulk add/update SPIs
router.post(
  "/spi/bulk",
  validate(spiBulkSubmitSchema),
  studentController.bulkUpsertSpi
);

// GET /api/students/spi - get all SPIs with computed CPI and CGPA
router.get("/spi", studentController.getSpis);

export default router;
