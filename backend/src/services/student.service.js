import prisma from "../config/prisma.js";

// Reusable select to exclude sensitive fields
const safeStudentSelect = {
  id: true,
  userId: true,
  fullName: true,
  phone: true,
  dob: true,
  studentType: true,
  mathsMarks: true,
  scienceMarks: true,
  englishMarks: true,
  socialScienceMarks: true,
  otherMarks: true,
  tenthPercentage: true,
  twelfthPercentage: true,
  d2dCgpa: true,
  d2dCollege: true,
  d2dDetails: true,
  profileLocked: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { email: true, role: true },
  },
};

/**
 * Get the current student's profile by userId
 */
export const getStudentProfile = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: safeStudentSelect,
  });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  return student;
};

/**
 * Submit a student's academic profile - locks the profile after submission
 * @param {string} userId
 * @param {Object} profileData - validated profile data
 */
export const submitStudentProfile = async (userId, profileData) => {
  // Find the student
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  // RULE 1 & 2: Profile is locked after submission - backend enforces this
  if (student.profileLocked) {
    const error = new Error("Profile is locked and cannot be edited");
    error.statusCode = 403;
    throw error;
  }

  const {
    fullName,
    phone,
    dob,
    studentType,
    mathsMarks,
    scienceMarks,
    englishMarks,
    socialScienceMarks,
    otherMarks,
    tenthPercentage,
    twelfthPercentage,
    d2dCgpa,
    d2dCollege,
    d2dDetails,
  } = profileData;

  // Lock the profile on submission
  const updatedStudent = await prisma.student.update({
    where: { userId },
    data: {
      fullName,
      phone,
      dob: new Date(dob),
      studentType,
      mathsMarks: mathsMarks ?? null,
      scienceMarks: scienceMarks ?? null,
      englishMarks: englishMarks ?? null,
      socialScienceMarks: socialScienceMarks ?? null,
      otherMarks: otherMarks ?? null,
      tenthPercentage,
      twelfthPercentage: studentType === "REGULAR" ? twelfthPercentage : null,
      d2dCgpa: studentType === "D2D" ? d2dCgpa : null,
      d2dCollege: studentType === "D2D" ? (d2dCollege ?? null) : null,
      d2dDetails: studentType === "D2D" ? (d2dDetails ?? null) : null,
      profileLocked: true, // << LOCKS PROFILE ON SUBMISSION
    },
    select: safeStudentSelect,
  });

  return updatedStudent;
};

/**
 * Update student profile (only allowed if NOT locked, or by TPO)
 * @param {string} userId - the student's userId
 * @param {Object} updateData
 * @param {boolean} isTpo - TPO can update locked profiles
 */
export const updateStudentProfile = async (userId, updateData, isTpo = false) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  // RULE 2: Backend enforces profile locking
  // RULE 3: TPO can update locked profiles
  if (student.profileLocked && !isTpo) {
    const error = new Error("Profile is locked and cannot be edited");
    error.statusCode = 403;
    throw error;
  }

  // Build update payload
  const updatePayload = { ...updateData };

  // If dob is being updated, parse it
  if (updatePayload.dob) {
    updatePayload.dob = new Date(updatePayload.dob);
  }

  const updatedStudent = await prisma.student.update({
    where: { userId },
    data: updatePayload,
    select: safeStudentSelect,
  });

  return updatedStudent;
};

/**
 * Get student by student ID (for TPO use)
 */
export const getStudentById = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: safeStudentSelect,
  });

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  return student;
};

/**
 * Get student by student ID for TPO update
 */
export const updateStudentById = async (studentId, updateData) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  if (updateData.dob) {
    updateData.dob = new Date(updateData.dob);
  }

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: updateData,
    select: safeStudentSelect,
  });

  return updatedStudent;
};

/**
 * Get all students (for TPO)
 */
export const getAllStudents = async (filters = {}) => {
  const where = {};

  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus;
  }

  if (filters.studentType) {
    where.studentType = filters.studentType;
  }

  if (filters.profileLocked !== undefined) {
    where.profileLocked = filters.profileLocked === "true";
  }

  const students = await prisma.student.findMany({
    where,
    select: safeStudentSelect,
    orderBy: { createdAt: "desc" },
  });

  return students;
};

/**
 * Update student verification status (TPO only)
 */
export const verifyStudent = async (studentId, verificationStatus) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: { verificationStatus },
    select: safeStudentSelect,
  });

  return updatedStudent;
};
