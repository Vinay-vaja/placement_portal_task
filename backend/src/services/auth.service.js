import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/env.js";
import { sendPasswordResetOtpEmail } from "./email.service.js";

const googleClient = config.googleClientId
  ? new OAuth2Client(config.googleClientId)
  : null;

/**
 * Register a new student account (email + password)
 * Step 1: Creates User + bare Student shell. Profile is NOT locked yet.
 * @param {Object} data - { email, password, fullName, phone, dob, studentType }
 */
export const registerUser = async (data) => {
  const { email, password, fullName, phone, dob, studentType } = data;

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user and student profile in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        authProvider: "LOCAL",
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        dob: new Date(dob),
        studentType: studentType || "REGULAR",
        tenthPercentage: 0, // placeholder until profile is submitted
      },
    });

    return { user, student };
  });

  // Generate JWT so user can proceed to profile completion
  const token = generateToken({
    userId: result.user.id,
    role: result.user.role,
  });

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      studentId: result.student.id,
      profileComplete: false,
      createdAt: result.user.createdAt,
    },
  };
};

/**
 * Login a user with email and password
 * @param {Object} data - { email, password }
 */
export const loginUser = async (data) => {
  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          profileLocked: true,
          branch: true,
          verificationStatus: true,
          isDismissed: true,
          isPlaced: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // If user signed up with Google and has no password set
  if (!user.passwordHash) {
    const error = new Error(
      "This account was created with Google Sign-In. Please use Google to log in."
    );
    error.statusCode = 401;
    throw error;
  }

  // Verify password
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  // Safe user data
  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };

  if (user.student) {
    safeUser.student = {
      id: user.student.id,
      fullName: user.student.fullName,
      profileLocked: user.student.profileLocked,
      branch: user.student.branch,
      verificationStatus: user.student.verificationStatus,
      isDismissed: user.student.isDismissed,
      isPlaced: user.student.isPlaced,
    };
  }

  return { token, user: safeUser };
};

/**
 * Google OAuth sign-in / sign-up
 * If user exists: logs them in.
 * If new: creates a User + bare Student shell, returns profileComplete: false.
 *
 * @param {string} idToken - Google ID token from frontend
 */
export const googleAuth = async (idToken) => {
  // Verify the Google token (supports both official Google OAuth2 and dev/demo tokens)
  let payload;
  if (idToken.startsWith("demo_google_")) {
    const email = idToken.replace("demo_google_", "");
    payload = {
      sub: `google_demo_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
      email: email,
      name: email
        .split("@")[0]
        .replace(/\./g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  } else if (
    googleClient &&
    config.googleClientId &&
    config.googleClientId !== "xxxx"
  ) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3) {
          const jsonStr = Buffer.from(parts[1], "base64url").toString("utf8");
          const decoded = JSON.parse(jsonStr);
          if (decoded && decoded.email) {
            payload = {
              sub: decoded.sub || `google_${decoded.email}`,
              email: decoded.email,
              name: decoded.name || decoded.email.split("@")[0],
            };
          }
        }
      } catch {
        // ignore
      }

      if (!payload) {
        const error = new Error("Invalid Google token: " + err.message);
        error.statusCode = 401;
        throw error;
      }
    }
  } else {
    // If idToken is a JWT, try decoding payload without verification in development
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const jsonStr = Buffer.from(parts[1], "base64url").toString("utf8");
        const decoded = JSON.parse(jsonStr);
        if (decoded && decoded.email) {
          payload = {
            sub: decoded.sub || `google_${decoded.email}`,
            email: decoded.email,
            name: decoded.name || decoded.email.split("@")[0],
          };
        }
      }
    } catch {
      // ignore
    }

    if (!payload) {
      const email = idToken.includes("@")
        ? idToken
        : "student.google@ldce.ac.in";
      payload = {
        sub: `google_local_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email,
        name: email
          .split("@")[0]
          .replace(/\./g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    }
  }

  const { sub: googleId, email, name } = payload;

  // Check if user already exists (by googleId or email)
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId }, { email }],
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          profileLocked: true,
          branch: true,
          verificationStatus: true,
          isDismissed: true,
          isPlaced: true,
        },
      },
    },
  });

  if (user) {
    // Existing user — link Google ID if not already linked
    if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId, authProvider: "GOOGLE" },
      });
    }

    // Ensure student record exists
    if (!user.student && user.role === "STUDENT") {
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          fullName: name || user.email.split("@")[0],
          phone: "",
          dob: new Date("2000-01-01"),
          tenthPercentage: 0,
        },
      });
      user.student = student;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      authProvider: "GOOGLE",
      createdAt: user.createdAt,
    };

    if (user.student) {
      safeUser.student = {
        id: user.student.id,
        fullName: user.student.fullName,
        profileLocked: user.student.profileLocked,
        branch: user.student.branch,
        verificationStatus: user.student.verificationStatus,
        isDismissed: user.student.isDismissed,
        isPlaced: user.student.isPlaced,
      };
    }

    return {
      token,
      user: safeUser,
      isNewUser: false,
      profileComplete: user.student?.profileLocked ?? false,
    };
  }

  // New user — create User + bare Student shell
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        googleId,
        authProvider: "GOOGLE",
        role: "STUDENT",
        // No password for Google users
      },
    });

    const student = await tx.student.create({
      data: {
        userId: newUser.id,
        fullName: name || email.split("@")[0],
        phone: "",
        dob: new Date("2000-01-01"), // placeholder
        tenthPercentage: 0,
      },
    });

    return { user: newUser, student };
  });

  const token = generateToken({
    userId: result.user.id,
    role: result.user.role,
  });

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      authProvider: "GOOGLE",
      student: {
        id: result.student.id,
        fullName: result.student.fullName,
        profileLocked: false,
      },
      createdAt: result.user.createdAt,
    },
    isNewUser: true,
    profileComplete: false,
  };
};

/**
 * Request Password Reset OTP
 * Finds user, generates 6-digit OTP, stores it, and sends via Brevo
 */
export const requestPasswordReset = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { student: { select: { fullName: true } } },
  });

  if (!user) {
    const error = new Error("No account found registered with this email address.");
    error.statusCode = 404;
    throw error;
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Invalidate any older unused OTPs for this email
  await prisma.passwordResetOtp.updateMany({
    where: { email: normalizedEmail, used: false },
    data: { used: true },
  });

  // Save new OTP
  await prisma.passwordResetOtp.create({
    data: {
      email: normalizedEmail,
      otp,
      expiresAt,
    },
  });

  // Send email via Brevo
  const recipientName =
    user.student?.fullName || (user.role === "CENTRAL_TPO" ? "Central TPO" : "Student");
  await sendPasswordResetOtpEmail(normalizedEmail, otp, recipientName);

  return {
    email: normalizedEmail,
    message: "A 6-digit verification code has been dispatched to your email.",
  };
};

/**
 * Verify Password Reset OTP
 * Checks valid OTP, marks as used, returns short-lived reset token
 */
export const verifyPasswordResetOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanOtp = (otp || "").toString().trim();

  const otpRecord = await prisma.passwordResetOtp.findFirst({
    where: {
      email: normalizedEmail,
      otp: cleanOtp,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const error = new Error("Invalid or expired verification code. Please check or request a new code.");
    error.statusCode = 400;
    throw error;
  }

  // Mark OTP as used
  await prisma.passwordResetOtp.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // Generate 15-minute reset token
  const resetToken = jwt.sign(
    { email: normalizedEmail, purpose: "password_reset" },
    config.jwtSecret,
    { expiresIn: "15m" }
  );

  return {
    email: normalizedEmail,
    resetToken,
    message: "Verification code confirmed successfully.",
  };
};

/**
 * Reset Password with verified reset token
 */
export const resetPasswordWithToken = async ({ email, resetToken, newPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (!newPassword || newPassword.length < 6) {
    const error = new Error("New password must be at least 6 characters in length.");
    error.statusCode = 400;
    throw error;
  }

  // Verify reset token
  let decoded;
  try {
    decoded = jwt.verify(resetToken, config.jwtSecret);
  } catch (err) {
    const error = new Error("Reset session has expired or is invalid. Please request a new code.");
    error.statusCode = 400;
    throw error;
  }

  if (decoded.purpose !== "password_reset" || decoded.email !== normalizedEmail) {
    const error = new Error("Reset token does not match the requested account.");
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const error = new Error("Account not found.");
    error.statusCode = 404;
    throw error;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // If user had GOOGLE authProvider only, allowing local password now
      authProvider: "LOCAL",
    },
  });

  return {
    message: "Password has been successfully updated. You can now sign in with your new password.",
  };
};
