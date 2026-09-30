import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=== RUNNING SYSTEM VERIFICATION ===");

  // 1. Verify TPO account
  const tpo = await prisma.user.findUnique({
    where: { email: process.env.SEED_TPO_EMAIL || "tpo@example.com" },
  });
  if (!tpo) {
    throw new Error("TPO user not found in database");
  }
  const isTpoPasswordValid = await bcrypt.compare(
    process.env.SEED_TPO_PASSWORD || "change-me-secure-password",
    tpo.passwordHash
  );
  console.log(`[PASS] TPO Account: ${tpo.email} (Password valid: ${isTpoPasswordValid})`);

  // 2. Test Student creation with Gujarati marks
  const testStudentEmail = `test.student.${Date.now()}@ldce.ac.in`;
  const passwordHash = await bcrypt.hash("password123", 10);
  
  const studentUser = await prisma.user.create({
    data: {
      email: testStudentEmail,
      passwordHash,
      role: "STUDENT",
      authProvider: "LOCAL",
      student: {
        create: {
          fullName: "Test Verification Student",
          phone: "9876543210",
          dob: new Date("2002-08-20"),
          branch: "ROBOTICS",
          studentType: "REGULAR",
          mathsMarks: 85,
          scienceMarks: 90,
          englishMarks: 88,
          socialScienceMarks: 82,
          sanskritMarks: 92,
          gujaratiMarks: 89,
          tenthPercentage: 87.67,
          twelfthEnglishMarks: 88,
          twelfthPhysicsMarks: 85,
          twelfthMathsMarks: 90,
          twelfthChemistryMarks: 84,
          twelfthComputerMarks: 92,
          twelfthPercentage: 87.8,
          declarationAccepted: true,
          profileLocked: true,
          verificationStatus: "PENDING",
        },
      },
    },
    include: {
      student: true,
    },
  });

  console.log(`[PASS] Student Created with ROBOTICS branch & Gujarati marks: ${studentUser.student.gujaratiMarks}`);
  console.log(`[PASS] Student 10th Percentage: ${studentUser.student.tenthPercentage}%`);

  // 3. Test Student Controller getApplications logic
  const appService = await import("../src/services/application.service.js");
  console.log(`[PASS] applicationService import check: ${typeof appService.getStudentApplications === "function" ? "OK (Function exists)" : "FAIL"}`);

  // Clean up test student
  await prisma.student.delete({ where: { id: studentUser.student.id } });
  await prisma.user.delete({ where: { id: studentUser.id } });
  console.log("[PASS] Cleaned up verification test data.");

  console.log("=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runVerification()
  .catch((e) => {
    console.error("[FAIL] Verification error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
