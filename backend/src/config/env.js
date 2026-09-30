import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  seedTpoEmail: process.env.SEED_TPO_EMAIL,
  seedTpoPassword: process.env.SEED_TPO_PASSWORD,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,

  // Brevo Email
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || "placements@college.edu",
  brevoSenderName: process.env.BREVO_SENDER_NAME || "Placement Cell",

  // Groq AI
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
};

/**
 * Validate required environment variables at startup
 */
export const validateEnv = () => {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[ERROR] Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  // Warn about optional but important config
  const warnings = [];
  if (!process.env.GOOGLE_CLIENT_ID) warnings.push("GOOGLE_CLIENT_ID (Google OAuth disabled)");
  if (!process.env.BREVO_API_KEY) warnings.push("BREVO_API_KEY (Email sending disabled)");
  if (!process.env.CLOUDINARY_CLOUD_NAME) warnings.push("CLOUDINARY_CLOUD_NAME (File uploads disabled)");

  if (warnings.length > 0) {
    console.warn(`[WARN] Optional env vars missing: ${warnings.join(", ")}`);
  }
};
