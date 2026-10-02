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
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { semesterSpis: true },
  });

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

  // Check global TPO setting: sem6_required
  const sem6Setting = await prisma.tpoSetting.findUnique({
    where: { key: "sem6_required" },
  });
  let isSem6Required = false;
  if (sem6Setting) {
    try {
      isSem6Required = typeof sem6Setting.value === "boolean" ? sem6Setting.value : JSON.parse(sem6Setting.value);
    } catch {
      isSem6Required = sem6Setting.value === "true";
    }
  }

  if (isSem6Required) {
    const candidateSpis = profileData.spis || profileData.semesterSpis || student.semesterSpis || [];
    const sem6 = candidateSpis.find(
      (s) => Number(s.semester) === 6 && s.spi !== undefined && s.spi !== null && s.spi !== "" && Number(s.spi) > 0
    );
    if (!sem6) {
      const error = new Error("Semester 6 SPI is mandatory for profile submission according to current TPO guidelines");
      error.statusCode = 400;
      throw error;
    }
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

  // Check phone uniqueness
  if (phone) {
    const normalizedPhone = phone.trim();
    const existingPhone = await prisma.student.findFirst({
      where: {
        phone: normalizedPhone,
        id: { not: student.id },
      },
    });
    if (existingPhone) {
      const error = new Error("An account with this phone number already exists");
      error.statusCode = 409;
      throw error;
    }
  }

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

  // Check phone uniqueness if phone is being updated
  if (payload.phone) {
    payload.phone = payload.phone.trim();
    const existingPhone = await prisma.student.findFirst({
      where: {
        phone: payload.phone,
        id: { not: student.id },
      },
    });
    if (existingPhone) {
      const error = new Error("An account with this phone number already exists");
      error.statusCode = 409;
      throw error;
    }
  }

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

  // Extract SPIs if passed in updateData
  const { spis, semesterSpis, ...studentFields } = updateData;
  const payload = { ...studentFields };

  // Remove derived/system fields to prevent manual override
  delete payload.tenthPercentage;
  delete payload.twelfthPercentage;
  delete payload.cpi;
  delete payload.cgpa;
  delete payload.verificationStatus;
  delete payload.isPlaced;
  delete payload.isDismissed;
  delete payload.dismissalReason;
  delete payload.user;

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
      mathsMarks: payload.mathsMarks !== undefined ? (payload.mathsMarks !== null && payload.mathsMarks !== "" ? Number(payload.mathsMarks) : null) : student.mathsMarks,
      scienceMarks: payload.scienceMarks !== undefined ? (payload.scienceMarks !== null && payload.scienceMarks !== "" ? Number(payload.scienceMarks) : null) : student.scienceMarks,
      englishMarks: payload.englishMarks !== undefined ? (payload.englishMarks !== null && payload.englishMarks !== "" ? Number(payload.englishMarks) : null) : student.englishMarks,
      socialScienceMarks: payload.socialScienceMarks !== undefined ? (payload.socialScienceMarks !== null && payload.socialScienceMarks !== "" ? Number(payload.socialScienceMarks) : null) : student.socialScienceMarks,
      sanskritMarks: payload.sanskritMarks !== undefined ? (payload.sanskritMarks !== null && payload.sanskritMarks !== "" ? Number(payload.sanskritMarks) : null) : student.sanskritMarks,
      gujaratiMarks: payload.gujaratiMarks !== undefined ? (payload.gujaratiMarks !== null && payload.gujaratiMarks !== "" ? Number(payload.gujaratiMarks) : null) : student.gujaratiMarks,
    };
    payload.tenthPercentage = calculateTenthPercentage(mergedTenth);

    // Cast payload marks to Float or null
    payload.mathsMarks = mergedTenth.mathsMarks;
    payload.scienceMarks = mergedTenth.scienceMarks;
    payload.englishMarks = mergedTenth.englishMarks;
    payload.socialScienceMarks = mergedTenth.socialScienceMarks;
    payload.sanskritMarks = mergedTenth.sanskritMarks;
    payload.gujaratiMarks = mergedTenth.gujaratiMarks;
  }

  if (
    payload.twelfthEnglishMarks !== undefined ||
    payload.twelfthPhysicsMarks !== undefined ||
    payload.twelfthMathsMarks !== undefined ||
    payload.twelfthChemistryMarks !== undefined ||
    payload.twelfthComputerMarks !== undefined
  ) {
    const mergedTwelfth = {
      twelfthEnglishMarks: payload.twelfthEnglishMarks !== undefined ? (payload.twelfthEnglishMarks !== null && payload.twelfthEnglishMarks !== "" ? Number(payload.twelfthEnglishMarks) : null) : student.twelfthEnglishMarks,
      twelfthPhysicsMarks: payload.twelfthPhysicsMarks !== undefined ? (payload.twelfthPhysicsMarks !== null && payload.twelfthPhysicsMarks !== "" ? Number(payload.twelfthPhysicsMarks) : null) : student.twelfthPhysicsMarks,
      twelfthMathsMarks: payload.twelfthMathsMarks !== undefined ? (payload.twelfthMathsMarks !== null && payload.twelfthMathsMarks !== "" ? Number(payload.twelfthMathsMarks) : null) : student.twelfthMathsMarks,
      twelfthChemistryMarks: payload.twelfthChemistryMarks !== undefined ? (payload.twelfthChemistryMarks !== null && payload.twelfthChemistryMarks !== "" ? Number(payload.twelfthChemistryMarks) : null) : student.twelfthChemistryMarks,
      twelfthComputerMarks: payload.twelfthComputerMarks !== undefined ? (payload.twelfthComputerMarks !== null && payload.twelfthComputerMarks !== "" ? Number(payload.twelfthComputerMarks) : null) : student.twelfthComputerMarks,
    };
    payload.twelfthPercentage = calculateTwelfthPercentage(mergedTwelfth);

    payload.twelfthEnglishMarks = mergedTwelfth.twelfthEnglishMarks;
    payload.twelfthPhysicsMarks = mergedTwelfth.twelfthPhysicsMarks;
    payload.twelfthMathsMarks = mergedTwelfth.twelfthMathsMarks;
    payload.twelfthChemistryMarks = mergedTwelfth.twelfthChemistryMarks;
    payload.twelfthComputerMarks = mergedTwelfth.twelfthComputerMarks;
  }

  if (payload.d2dCgpa !== undefined && payload.d2dCgpa !== null && payload.d2dCgpa !== "") {
    payload.d2dCgpa = Number(payload.d2dCgpa);
  }
  if (payload.d2dAcpcRank !== undefined && payload.d2dAcpcRank !== null && payload.d2dAcpcRank !== "") {
    payload.d2dAcpcRank = Number(payload.d2dAcpcRank);
  }

  // Preserve profileLocked === true
  payload.profileLocked = true;

  const rawSpis = spis || semesterSpis;

  const updatedStudent = await prisma.$transaction(async (tx) => {
    if (Array.isArray(rawSpis)) {
      for (const s of rawSpis) {
        if (s.semester && s.spi !== undefined && s.spi !== null && s.spi !== "") {
          const numSpi = Number(s.spi);
          if (!isNaN(numSpi) && numSpi >= 0 && numSpi <= 10) {
            await tx.semesterSpi.upsert({
              where: {
                studentId_semester: {
                  studentId: student.id,
                  semester: Number(s.semester),
                },
              },
              update: { spi: numSpi },
              create: {
                studentId: student.id,
                semester: Number(s.semester),
                spi: numSpi,
              },
            });
          }
        }
      }
    }

    return tx.student.update({
      where: { id: studentId },
      data: payload,
      select: safeStudentSelect,
    });
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
  } else {
    // By default, TPO directory and approval lists only display students who have locked/submitted their profiles
    where.profileLocked = true;
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

  // When minCpi or minCgpa filter is requested, we must compute metrics across
  // all candidate records to calculate the true matching total and correct page slice.
  const hasCpiFilter = Boolean(filters.minCpi || filters.minCgpa);

  if (hasCpiFilter) {
    const allStudents = await prisma.student.findMany({
      where,
      select: safeStudentSelect,
      orderBy: pagination.orderBy || { createdAt: "desc" },
    });

    let filtered = allStudents.map(enrichWithComputedFields);

    if (filters.minCpi) {
      const minCpi = parseFloat(filters.minCpi);
      filtered = filtered.filter((s) => s.cpi !== null && s.cpi >= minCpi);
    }
    if (filters.minCgpa) {
      const minCgpa = parseFloat(filters.minCgpa);
      filtered = filtered.filter((s) => s.cgpa !== null && s.cgpa >= minCgpa);
    }

    const total = filtered.length;
    const skip = pagination.skip || 0;
    const take = pagination.take || 20;
    const paginatedStudents = filtered.slice(skip, skip + take);

    return { students: paginatedStudents, total };
  }

  // Standard database-level pagination when no computed CPI/CGPA filter is used
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

  const enriched = students.map(enrichWithComputedFields);
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

  if (student.profileLocked) {
    const error = new Error("Profile is locked and SPIs cannot be edited");
    error.statusCode = 403;
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

  if (student.profileLocked) {
    const error = new Error("Profile is locked and SPIs cannot be edited");
    error.statusCode = 403;
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
