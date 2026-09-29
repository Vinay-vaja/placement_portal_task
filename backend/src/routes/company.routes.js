import { Router } from "express";
import * as companyController from "../controllers/company.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../validators/validate.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "../validators/company.validator.js";

const router = Router();

// All company routes require authentication
router.use(authMiddleware);

// GET /api/companies - any authenticated user can view companies
router.get("/", companyController.getCompanies);

// GET /api/companies/:id - any authenticated user can view a company
router.get("/:id", companyController.getCompanyById);

// POST /api/companies - TPO only (accepts JSON or multipart/form-data with image)
router.post(
  "/",
  requireRole("CENTRAL_TPO"),
  upload.single("image"),
  validate(createCompanySchema),
  companyController.createCompany
);

// PUT /api/companies/:id - TPO only (accepts JSON or multipart/form-data with image)
router.put(
  "/:id",
  requireRole("CENTRAL_TPO"),
  upload.single("image"),
  validate(updateCompanySchema),
  companyController.updateCompany
);

// DELETE /api/companies/:id - TPO only
router.delete(
  "/:id",
  requireRole("CENTRAL_TPO"),
  companyController.deleteCompany
);

export default router;
