import { Router } from "express";
import * as uploadController from "../controllers/upload.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

// Upload requires authentication
router.use(authMiddleware);

// POST /api/upload/image
router.post("/image", upload.single("image"), uploadController.uploadImage);

export default router;
