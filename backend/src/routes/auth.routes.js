import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../validators/validate.js";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from "../validators/auth.validator.js";

const router = Router();

// POST /api/auth/register - Register with email & password
router.post("/register", validate(registerSchema), authController.register);

// POST /api/auth/login - Login with email & password
router.post("/login", validate(loginSchema), authController.login);

// POST /api/auth/google - Google OAuth sign-in/sign-up
router.post("/google", validate(googleAuthSchema), authController.googleAuth);

export default router;
