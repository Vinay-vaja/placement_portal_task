import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config/env.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import tpoRoutes from "./routes/tpo.routes.js";
import companyRoutes from "./routes/company.routes.js";
import driveRoutes from "./routes/drive.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

// Middleware
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";

const app = express();

// ==========================================
// CORS Configuration
// ==========================================
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================
// Body Parsing
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Root & Health Check
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: `Mini Placement Portal Backend is running on port ${config.port}`,
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Placement Portal API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ==========================================
// Routes
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/tpo", tpoRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/drives", driveRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/upload", uploadRoutes);

// ==========================================
// Error Handling (must be mounted last)
// ==========================================
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
