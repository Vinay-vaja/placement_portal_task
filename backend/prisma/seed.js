import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const tpoEmail = process.env.SEED_TPO_EMAIL;
  const tpoPassword = process.env.SEED_TPO_PASSWORD;

  if (!tpoEmail || !tpoPassword) {
    console.error(
      "[ERROR] SEED_TPO_EMAIL and SEED_TPO_PASSWORD must be set in .env"
    );
    process.exit(1);
  }

  console.log("Starting database seed...");

  // ============================
  // 1. Create Central TPO account
  // ============================
  const passwordHash = await bcrypt.hash(tpoPassword, 12);
  const tpo = await prisma.user.upsert({
    where: { email: tpoEmail },
    update: {
      passwordHash,
      role: "CENTRAL_TPO",
    },
    create: {
      email: tpoEmail,
      passwordHash,
      role: "CENTRAL_TPO",
      authProvider: "LOCAL",
    },
  });

  console.log(`Central TPO account ensured:`);
  console.log(`   Email: ${tpo.email}`);
  console.log(`   Role: ${tpo.role}`);
  console.log(`   ID: ${tpo.id}`);

  // ============================
  // 2. Create default TPO settings
  // ============================
  const defaultSettings = [
    {
      key: "required_semesters",
      value: JSON.stringify([1, 2, 3, 4, 5]),
    },
    {
      key: "sem6_required",
      value: JSON.stringify(false),
    },
    {
      key: "placement_active",
      value: JSON.stringify(true),
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.tpoSetting.upsert({
      where: { key: setting.key },
      update: {},  // Don't overwrite existing settings
      create: setting,
    });
  }

  console.log("Default TPO settings ensured.");

  console.log("\nSeed completed successfully!");
}

main()
  .catch((error) => {
    console.error("[ERROR] Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
