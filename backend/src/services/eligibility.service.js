import prisma from "../config/prisma.js";

/**
 * Core eligibility check - backend is the FINAL AUTHORITY
 * Returns { eligible: boolean, reasons: string[] }
 *
 * @param {Object} student - Student record from DB
 * @param {Object} drive - RecruitmentDrive record from DB
 */
export const checkStudentEligibility = (student, drive) => {
  const reasons = [];

  // 1. Student must have a verified/submitted profile
  if (!student.profileLocked) {
    reasons.push("Student profile must be submitted before applying");
  }

  // 2. Student type check
  if (
    drive.allowedStudentType !== "ALL" &&
    drive.allowedStudentType !== student.studentType
  ) {
    reasons.push(
      `This drive is only open to ${drive.allowedStudentType} students`
    );
  }

  // 3. 10th percentage check (applies to all students)
  if (
    drive.minTenthPercentage !== null &&
    drive.minTenthPercentage !== undefined
  ) {
    if (student.tenthPercentage < drive.minTenthPercentage) {
      reasons.push(
        `Minimum 10th percentage requirement not met (required: ${drive.minTenthPercentage}%, yours: ${student.tenthPercentage}%)`
      );
    }
  }

  // 4. 12th percentage check (only applicable for REGULAR students)
  if (
    student.studentType === "REGULAR" &&
    drive.minTwelfthPercentage !== null &&
    drive.minTwelfthPercentage !== undefined
  ) {
    if (
      student.twelfthPercentage === null ||
      student.twelfthPercentage === undefined ||
      student.twelfthPercentage < drive.minTwelfthPercentage
    ) {
      reasons.push(
        `Minimum 12th percentage requirement not met (required: ${drive.minTwelfthPercentage}%, yours: ${student.twelfthPercentage ?? "N/A"}%)`
      );
    }
  }

  // 5. CGPA / D2D CGPA check
  if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
    if (student.studentType === "D2D") {
      // D2D students use d2dCgpa
      if (
        student.d2dCgpa === null ||
        student.d2dCgpa === undefined ||
        student.d2dCgpa < drive.minCgpa
      ) {
        reasons.push(
          `Minimum CGPA requirement not met (required: ${drive.minCgpa}, yours: ${student.d2dCgpa ?? "N/A"})`
        );
      }
    }
    // For REGULAR students, minCgpa could relate to a CPI or standard CGPA
    // Currently REGULAR students don't have a CGPA field - handled via CPI below
  }

  // 6. CPI check (applies to all students - can be thought of as semester CPI)
  if (drive.minCpi !== null && drive.minCpi !== undefined) {
    // Only D2D students have a CGPA/CPI field in current schema
    // If a drive specifies minCpi and student is D2D, we use d2dCgpa as proxy
    if (student.studentType === "D2D") {
      if (
        student.d2dCgpa === null ||
        student.d2dCgpa === undefined ||
        student.d2dCgpa < drive.minCpi
      ) {
        reasons.push(
          `Minimum CPI requirement not met (required: ${drive.minCpi}, yours: ${student.d2dCgpa ?? "N/A"})`
        );
      }
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};

/**
 * Get all eligible students for a drive (TPO utility)
 * @param {Object} drive - The recruitment drive record
 * @param {Object} filters - Optional filters
 */
export const getEligibleStudents = async (drive, filters = {}) => {
  // Build where clause for pre-filtering at DB level
  const where = {
    profileLocked: true, // only submitted profiles
  };

  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus;
  }

  if (filters.studentType) {
    where.studentType = filters.studentType;
  }

  // Drive-level student type filter
  if (drive.allowedStudentType !== "ALL") {
    where.studentType = drive.allowedStudentType;
  }

  // Pre-filter by 10th percentage at DB level
  if (drive.minTenthPercentage) {
    where.tenthPercentage = { gte: drive.minTenthPercentage };
  }

  // Pre-filter by CGPA for D2D
  if (drive.minCgpa && where.studentType === "D2D") {
    where.d2dCgpa = { gte: drive.minCgpa };
  }

  // Optional query param filters
  if (filters.minTenth) {
    where.tenthPercentage = { gte: parseFloat(filters.minTenth) };
  }

  if (filters.minCgpa) {
    where.d2dCgpa = { gte: parseFloat(filters.minCgpa) };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { email: true } },
    },
  });

  // Run eligibility check on each candidate
  const eligibleStudents = students
    .map((student) => {
      const eligibility = checkStudentEligibility(student, drive);
      return {
        ...student,
        eligibility,
      };
    })
    .filter((s) => s.eligibility.eligible);

  return eligibleStudents;
};
