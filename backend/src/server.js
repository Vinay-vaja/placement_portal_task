import "dotenv/config";
import { validateEnv, config } from "./config/env.js";
import app from "./app.js";
import prisma from "./config/prisma.js";

// Validate required environment variables before starting
validateEnv();

const PORT = config.port;

// Optionally test database connection before starting
const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log("=========================================");
      console.log(`Mini Placement Portal API`);
      console.log(`   Running on port: ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("=========================================");
    });
  } catch (error) {
    console.error("[ERROR] Failed to start server:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
