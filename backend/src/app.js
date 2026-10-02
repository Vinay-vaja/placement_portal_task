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
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      try {
        const cleanOrigin = origin.replace(/\/$/, "");
        const hostname = new URL(cleanOrigin).hostname;
        const allowedOrigins = (config.clientUrl || "")
          .split(",")
          .map((u) => u.trim().replace(/\/$/, ""))
          .filter(Boolean);

        // Allow localhost, any Vercel domain, or explicitly configured clientUrl
        if (
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
          cleanOrigin === "https://ldce-placement-portal.vercel.app" ||
          cleanOrigin === "https://placement-portal-gilt-eta.vercel.app" ||
          hostname.endsWith(".vercel.app") ||
          allowedOrigins.includes(cleanOrigin) ||
          allowedOrigins.includes("*") ||
          process.env.NODE_ENV !== "production"
        ) {
          return callback(null, true);
        }
      } catch (err) {
        // Fallback for unparseable URLs
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Disposition"],
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
