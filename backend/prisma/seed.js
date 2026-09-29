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

  // Check if TPO already exists (idempotent)
  const existingTpo = await prisma.user.findUnique({
    where: { email: tpoEmail },
  });

  if (existingTpo) {
    console.log(`TPO account already exists: ${tpoEmail}`);
    console.log("Seed is idempotent - skipping duplicate creation.");
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(tpoPassword, 12);

  // Create Central TPO user
  const tpo = await prisma.user.create({
    data: {
      email: tpoEmail,
      passwordHash,
      role: "CENTRAL_TPO",
    },
  });

  console.log(`Central TPO account created:`);
  console.log(`   Email: ${tpo.email}`);
  console.log(`   Role: ${tpo.role}`);
  console.log(`   ID: ${tpo.id}`);
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
