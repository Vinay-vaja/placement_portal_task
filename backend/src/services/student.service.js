import prisma from "../config/prisma.js";
import {
  calculateTenthPercentage,
  calculateTwelfthPercentage,
  calculateCpi,
  calculateCgpa,
} from "../utils/percentage.js";

// Reusable select to include all safe fields
const safeStudentSelect = {
  id: true,
  userId: true,
  fullName: true,
  phone: true,
  dob: true,
  branch: true,
  studentType: true,

  // 10th marks
  mathsMarks: true,
  scienceMarks: true,
  englishMarks: true,
  socialScienceMarks: true,
  sanskritMarks: true,
  gujaratiMarks: true,
  tenthPercentage: true,

  // 12th marks
  twelfthEnglishMarks: true,
  twelfthPhysicsMarks: true,
  twelfthMathsMarks: true,
  twelfthChemistryMarks: true,
  twelfthComputerMarks: true,
  twelfthPercentage: true,

  // D2D fields
  d2dCgpa: true,
  d2dCollege: true,
  d2dDetails: true,
  d2dAcpcRank: true,

  // Profile management
  profileLocked: true,
  verificationStatus: true,
  declarationAccepted: true,

  // Placement tracking
  isPlaced: true,
  currentPackageLpa: true,
  isDismissed: true,
  dismissalReason: true,

  createdAt: true,
  updatedAt: true,

  // Relations
  user: {
    select: { email: true, role: true, authProvider: true },
  },
  semesterSpis: {
    orderBy: { semester: "asc" },
    select: { id: true, semester: true, spi: true },
  },
};

/**
 * Enrich a student object with computed CPI and CGPA
 */
const enrichWithComputedFields = (student) => {
  if (!student) return student;

  const spis = student.semesterSpis || [];
  return {
    ...student,
    cpi: calculateCpi(spis),
    cgpa: calculateCgpa(spis),
  };
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

  return enrichWithComputedFields(student);
};

/**
 * Submit/complete a student's academic profile — locks the profile after submission.
 * Used for both POST /students/profile and POST /students/complete-profile.
 *
 * @param {string} userId
 * @param {Object} profileData - validated profile data
 */
export const submitStudentProfile = async (userId, profileData) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  // Profile is locked after submission — backend enforces this
  if (student.profileLocked) {
    const error = new Error("Profile is already locked and cannot be edited");
    error.statusCode = 403;
    throw error;
  }

  const {
    fullName,
    phone,
    dob,
    branch,
    studentType,
    mathsMarks,
    scienceMarks,
    englishMarks,
    socialScienceMarks,
    sanskritMarks,
    gujaratiMarks,
    twelfthEnglishMarks,
    twelfthPhysicsMarks,
    twelfthMathsMarks,
    twelfthChemistryMarks,
    twelfthComputerMarks,
    d2dCgpa,
    d2dCollege,
    d2dDetails,
    d2dAcpcRank,
    declarationAccepted,
    password, // Optional — for Google users setting a password
  } = profileData;

  // Auto-calculate percentages
  const tenthPercentage = calculateTenthPercentage({
    mathsMarks,
    scienceMarks,
    englishMarks,
    socialScienceMarks,
    sanskritMarks,
    gujaratiMarks,
  });

  const twelfthPercentage =
    studentType === "REGULAR"
      ? calculateTwelfthPercentage({
          twelfthEnglishMarks,
          twelfthPhysicsMarks,
          twelfthMathsMarks,
          twelfthChemistryMarks,
          twelfthComputerMarks,
        })
      : null;

  // Build update data
  const updateData = {
    fullName: fullName || student.fullName,
    phone: phone || student.phone,
    dob: dob ? new Date(dob) : student.dob,
    branch,
    studentType,

    // 10th marks
    mathsMarks,
    scienceMarks,
    englishMarks,
    socialScienceMarks,
    sanskritMarks,
    gujaratiMarks,
    tenthPercentage,

    // 12th marks (only for REGULAR)
    twelfthEnglishMarks: studentType === "REGULAR" ? twelfthEnglishMarks : null,
    twelfthPhysicsMarks: studentType === "REGULAR" ? twelfthPhysicsMarks : null,
    twelfthMathsMarks: studentType === "REGULAR" ? twelfthMathsMarks : null,
    twelfthChemistryMarks: studentType === "REGULAR" ? twelfthChemistryMarks : null,
    twelfthComputerMarks: studentType === "REGULAR" ? twelfthComputerMarks : null,
    twelfthPercentage,

    // D2D fields
    d2dCgpa: studentType === "D2D" ? d2dCgpa : null,
    d2dCollege: studentType === "D2D" ? (d2dCollege ?? null) : null,
    d2dDetails: studentType === "D2D" ? (d2dDetails ?? null) : null,
    d2dAcpcRank: studentType === "D2D" ? (d2dAcpcRank ?? null) : null,

    declarationAccepted: declarationAccepted ?? false,
    profileLocked: true, // << LOCKS PROFILE ON SUBMISSION
  };

  // If Google user is setting a password during profile completion
  let userUpdate = null;
  if (password) {
    const { hashPassword } = await import("../utils/password.js");
    userUpdate = { passwordHash: await hashPassword(password) };
  }

  // Use transaction for atomic update
  const updatedStudent = await prisma.$transaction(async (tx) => {
    if (userUpdate) {
      await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    return tx.student.update({
      where: { userId },
      data: updateData,
      select: safeStudentSelect,
    });
  });

  return enrichWithComputedFields(updatedStudent);
};

/**
 * Update student profile (only allowed if NOT locked, or by TPO)
 */
export const updateStudentProfile = async (userId, updateData, isTpo = false) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  // Backend enforces profile locking — TPO can update locked profiles
  if (student.profileLocked && !isTpo) {
    const error = new Error("Profile is locked and cannot be edited");
    error.statusCode = 403;
    throw error;
  }

  const payload = { ...updateData };

  // Parse dob if being updated
  if (payload.dob) {
    payload.dob = new Date(payload.dob);
  }

  // Recalculate percentages if marks are being updated
  if (
    payload.mathsMarks !== undefined ||
    payload.scienceMarks !== undefined ||
    payload.englishMarks !== undefined ||
    payload.socialScienceMarks !== undefined ||
    payload.sanskritMarks !== undefined ||
    payload.gujaratiMarks !== undefined
  ) {
    // Merge existing marks with updates
    const mergedTenth = {
      mathsMarks: payload.mathsMarks ?? student.mathsMarks,
      scienceMarks: payload.scienceMarks ?? student.scienceMarks,
      englishMarks: payload.englishMarks ?? student.englishMarks,
      socialScienceMarks: payload.socialScienceMarks ?? student.socialScienceMarks,
      sanskritMarks: payload.sanskritMarks ?? student.sanskritMarks,
      gujaratiMarks: payload.gujaratiMarks ?? student.gujaratiMarks,
    };
    payload.tenthPercentage = calculateTenthPercentage(mergedTenth);
  }

  if (
    payload.twelfthEnglishMarks !== undefined ||
    payload.twelfthPhysicsMarks !== undefined ||
    payload.twelfthMathsMarks !== undefined ||
    payload.twelfthChemistryMarks !== undefined ||
    payload.twelfthComputerMarks !== undefined
  ) {
    const mergedTwelfth = {
      twelfthEnglishMarks: payload.twelfthEnglishMarks ?? student.twelfthEnglishMarks,
      twelfthPhysicsMarks: payload.twelfthPhysicsMarks ?? student.twelfthPhysicsMarks,
      twelfthMathsMarks: payload.twelfthMathsMarks ?? student.twelfthMathsMarks,
      twelfthChemistryMarks: payload.twelfthChemistryMarks ?? student.twelfthChemistryMarks,
      twelfthComputerMarks: payload.twelfthComputerMarks ?? student.twelfthComputerMarks,
    };
    payload.twelfthPercentage = calculateTwelfthPercentage(mergedTwelfth);
  }

  const updatedStudent = await prisma.student.update({
    where: { userId },
    data: payload,
    select: safeStudentSelect,
  });

  return enrichWithComputedFields(updatedStudent);
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

  return enrichWithComputedFields(student);
};

/**
 * Update a student by studentId (TPO use — can update locked profiles)
 */
export const updateStudentById = async (studentId, updateData) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const payload = { ...updateData };

  if (payload.dob) {
    payload.dob = new Date(payload.dob);
  }

  // Recalculate percentages if marks are being updated
  if (
    payload.mathsMarks !== undefined ||
    payload.scienceMarks !== undefined ||
    payload.englishMarks !== undefined ||
    payload.socialScienceMarks !== undefined ||
    payload.sanskritMarks !== undefined ||
    payload.gujaratiMarks !== undefined
  ) {
    const mergedTenth = {
      mathsMarks: payload.mathsMarks ?? student.mathsMarks,
      scienceMarks: payload.scienceMarks ?? student.scienceMarks,
      englishMarks: payload.englishMarks ?? student.englishMarks,
      socialScienceMarks: payload.socialScienceMarks ?? student.socialScienceMarks,
      sanskritMarks: payload.sanskritMarks ?? student.sanskritMarks,
      gujaratiMarks: payload.gujaratiMarks ?? student.gujaratiMarks,
    };
    payload.tenthPercentage = calculateTenthPercentage(mergedTenth);
  }

  if (
    payload.twelfthEnglishMarks !== undefined ||
    payload.twelfthPhysicsMarks !== undefined ||
    payload.twelfthMathsMarks !== undefined ||
    payload.twelfthChemistryMarks !== undefined ||
    payload.twelfthComputerMarks !== undefined
  ) {
    const mergedTwelfth = {
      twelfthEnglishMarks: payload.twelfthEnglishMarks ?? student.twelfthEnglishMarks,
      twelfthPhysicsMarks: payload.twelfthPhysicsMarks ?? student.twelfthPhysicsMarks,
      twelfthMathsMarks: payload.twelfthMathsMarks ?? student.twelfthMathsMarks,
      twelfthChemistryMarks: payload.twelfthChemistryMarks ?? student.twelfthChemistryMarks,
      twelfthComputerMarks: payload.twelfthComputerMarks ?? student.twelfthComputerMarks,
    };
    payload.twelfthPercentage = calculateTwelfthPercentage(mergedTwelfth);
  }

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: payload,
    select: safeStudentSelect,
  });

  return enrichWithComputedFields(updatedStudent);
};

/**
 * Get all students (for TPO) with advanced filtering, search, and pagination
 */
export const getAllStudents = async (filters = {}, pagination = {}) => {
  const where = {};

  // Status filters
  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus;
  }
  if (filters.studentType) {
    where.studentType = filters.studentType;
  }
  if (filters.profileLocked !== undefined) {
    where.profileLocked = filters.profileLocked === "true" || filters.profileLocked === true;
  }
  if (filters.isPlaced !== undefined) {
    where.isPlaced = filters.isPlaced === "true" || filters.isPlaced === true;
  }
  if (filters.isDismissed !== undefined) {
    where.isDismissed = filters.isDismissed === "true" || filters.isDismissed === true;
  }

  // Branch filter (supports comma-separated: ?branch=CE,IT,AIML)
  if (filters.branch) {
    const branches = filters.branch.split(",").map((b) => b.trim().toUpperCase());
    where.branch = { in: branches };
  }

  // Academic filters
  if (filters.minTenth) {
    where.tenthPercentage = { gte: parseFloat(filters.minTenth) };
  }
  if (filters.minTwelfth) {
    where.twelfthPercentage = { gte: parseFloat(filters.minTwelfth) };
  }

  // Search by name or email
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      select: safeStudentSelect,
      orderBy: pagination.orderBy || { createdAt: "desc" },
      skip: pagination.skip || 0,
      take: pagination.take || 20,
    }),
    prisma.student.count({ where }),
  ]);

  // Enrich with computed CPI/CGPA and apply CPI/CGPA filters post-query
  let enriched = students.map(enrichWithComputedFields);

  // Post-query CPI/CGPA filtering (these are computed fields not in DB)
  if (filters.minCpi) {
    const minCpi = parseFloat(filters.minCpi);
    enriched = enriched.filter((s) => s.cpi !== null && s.cpi >= minCpi);
  }
  if (filters.minCgpa) {
    const minCgpa = parseFloat(filters.minCgpa);
    enriched = enriched.filter((s) => s.cgpa !== null && s.cgpa >= minCgpa);
  }

  return { students: enriched, total };
};

/**
 * Update student verification status (TPO only)
 */
export const verifyStudent = async (studentId, verificationStatus, rejectionReason) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const updateData = { verificationStatus };
  if (verificationStatus === "REJECTED" && rejectionReason) {
    updateData.dismissalReason = rejectionReason;
  } else if (verificationStatus === "VERIFIED" || verificationStatus === "PENDING") {
    // If was previously marked with a rejection reason, clear it
    if (student.dismissalReason && student.verificationStatus === "REJECTED") {
      updateData.dismissalReason = null;
    }
  }

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: updateData,
    select: safeStudentSelect,
  });

  return enrichWithComputedFields(updatedStudent);
};

// ============================
// SPI Management
// ============================

/**
 * Add or update a single semester SPI
 */
export const upsertSpi = async (userId, semester, spi) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.semesterSpi.upsert({
    where: {
      studentId_semester: {
        studentId: student.id,
        semester,
      },
    },
    update: { spi },
    create: {
      studentId: student.id,
      semester,
      spi,
    },
  });

  return result;
};

/**
 * Bulk upsert SPIs
 */
export const bulkUpsertSpi = async (userId, spis) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  const results = await prisma.$transaction(
    spis.map((s) =>
      prisma.semesterSpi.upsert({
        where: {
          studentId_semester: {
            studentId: student.id,
            semester: s.semester,
          },
        },
        update: { spi: s.spi },
        create: {
          studentId: student.id,
          semester: s.semester,
          spi: s.spi,
        },
      })
    )
  );

  return results;
};

/**
 * Get all SPIs for a student (with computed CPI and CGPA)
 */
export const getStudentSpis = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      semesterSpis: { orderBy: { semester: "asc" } },
    },
  });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    spis: student.semesterSpis,
    cpi: calculateCpi(student.semesterSpis),
    cgpa: calculateCgpa(student.semesterSpis),
  };
};
