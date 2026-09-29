import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Register a new student account
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
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        dob: new Date(dob),
        studentType: studentType || "REGULAR",
        // Initialize with 0 as placeholder; real data submitted via POST /profile
        tenthPercentage: 0,
      },
    });

    return { user, student };
  });

  // Return safe user data (never return password)
  return {
    id: result.user.id,
    email: result.user.email,
    role: result.user.role,
    studentId: result.student.id,
    createdAt: result.user.createdAt,
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
        select: { id: true, fullName: true, profileLocked: true },
      },
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
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
    createdAt: user.createdAt,
  };

  if (user.student) {
    safeUser.student = {
      id: user.student.id,
      fullName: user.student.fullName,
      profileLocked: user.student.profileLocked,
    };
  }

  return { token, user: safeUser };
};
