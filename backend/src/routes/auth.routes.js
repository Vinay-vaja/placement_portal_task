import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../validators/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(registerSchema), authController.register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), authController.login);

export default router;
