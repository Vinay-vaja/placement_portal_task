import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/env.js";

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
  if (!googleClient) {
    const error = new Error("Google OAuth is not configured on this server");
    error.statusCode = 500;
    throw error;
  }

  // Verify the Google token
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    const error = new Error("Invalid Google token");
    error.statusCode = 401;
    throw error;
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
