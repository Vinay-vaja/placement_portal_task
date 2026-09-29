import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance across the application
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
