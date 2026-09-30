import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function cleanAndSeed() {
  console.log("=== STARTING FULL DATABASE CLEAN & SEED ===");

  // 1. Delete all data in cascade order
  console.log("Cleaning database tables...");
  await prisma.application.deleteMany({});
  await prisma.semesterSpi.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.recruitmentDrive.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tpoSetting.deleteMany({});
  console.log("[OK] Database completely wiped and clean.");

  // 2. Create Central TPO account
  const tpoEmail = process.env.SEED_TPO_EMAIL || "tpo@ldce.ac.in";
  const tpoPassword = process.env.SEED_TPO_PASSWORD || "12345";
  const passwordHash = await bcrypt.hash(tpoPassword, 12);

  const tpo = await prisma.user.create({
    data: {
      email: tpoEmail,
      passwordHash,
      role: "CENTRAL_TPO",
      authProvider: "LOCAL",
    },
  });

  console.log(`[OK] Created Central TPO account:`);
  console.log(`     Email:    ${tpo.email}`);
  console.log(`     Password: ${tpoPassword}`);
  console.log(`     Role:     ${tpo.role}`);

  // 3. Create default TPO settings
  const defaultSettings = [
    { key: "required_semesters", value: JSON.stringify([1, 2, 3, 4, 5]) },
    { key: "sem6_required", value: JSON.stringify(false) },
    { key: "placement_active", value: JSON.stringify(true) },
  ];

  for (const s of defaultSettings) {
    await prisma.tpoSetting.create({ data: s });
  }
  console.log("[OK] Default TPO settings initialized.");

  // 4. Create a sample verified company and drive so students can test drives immediately
  const company = await prisma.company.create({
    data: {
      name: "Tata Consultancy Services (TCS)",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
    },
  });

  await prisma.recruitmentDrive.create({
    data: {
      companyId: company.id,
      role: "Assistant System Engineer",
      ctc: 7.0,
      location: "Gandhinagar / Ahmedabad",
      description: "Graduate engineering recruitment program for software development, cloud, and AI engineering.",
      minTenthPercentage: 60,
      minTwelfthPercentage: 60,
      minCpi: 6.5,
      allowedBranches: ["CE", "IT", "AIML", "EC", "EE", "ROBOTICS", "AUTOMOBILE"],
      status: "ACTIVE",
    },
  });

  console.log("[OK] Seeded sample recruitment drive for TCS.");
  console.log("=== CLEAN & SEED COMPLETED SUCCESSFULLY ===");
}

cleanAndSeed()
  .catch((e) => {
    console.error("[ERROR] Failed to clean and seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
