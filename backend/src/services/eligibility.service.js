import prisma from "../config/prisma.js";
import { calculateCpi, calculateCgpa } from "../utils/percentage.js";

/**
 * Core eligibility check — backend is the FINAL AUTHORITY
 * Returns { eligible: boolean, reasons: string[] }
 *
 * Checks:
 * 1. Profile must be submitted/locked
 * 2. Student must not be dismissed
 * 3. Student type check
 * 4. Branch check
 * 5. 10th percentage check
 * 6. 12th percentage check (REGULAR only)
 * 7. CGPA check
 * 8. CPI check
 * 9. 2x salary rule (if already placed)
 *
 * @param {Object} student - Student record (with semesterSpis included)
 * @param {Object} drive - RecruitmentDrive record from DB
 */
export const checkStudentEligibility = (student, drive) => {
  const reasons = [];

  // 1. Student must have a submitted profile
  if (!student.profileLocked) {
    reasons.push("Student profile must be submitted before applying");
  }

  // 2. Student must not be dismissed from placement
  if (student.isDismissed) {
    reasons.push("You have been dismissed from the placement process");
  }

  // 3. Student type check
  if (
    drive.allowedStudentType !== "ALL" &&
    drive.allowedStudentType !== student.studentType
  ) {
    reasons.push(
      `This drive is only open to ${drive.allowedStudentType} students`
    );
  }

  // 4. Branch check
  if (drive.allowedBranches && drive.allowedBranches.length > 0) {
    if (!student.branch || !drive.allowedBranches.includes(student.branch)) {
      reasons.push(
        `This drive is only open to branches: ${drive.allowedBranches.join(", ")}. Your branch: ${student.branch || "Not set"}`
      );
    }
  }

  // 5. 10th percentage check
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

  // 6. 12th percentage check (only for REGULAR students)
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

  // 7. CGPA check (computed from sem 5+6 SPI)
  if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
    const spis = student.semesterSpis || [];
    const studentCgpa = calculateCgpa(spis);

    // For D2D students, also consider d2dCgpa
    const effectiveCgpa =
      student.studentType === "D2D" && student.d2dCgpa !== null
        ? Math.max(studentCgpa ?? 0, student.d2dCgpa)
        : studentCgpa;

    if (effectiveCgpa === null || effectiveCgpa < drive.minCgpa) {
      reasons.push(
        `Minimum CGPA requirement not met (required: ${drive.minCgpa}, yours: ${effectiveCgpa ?? "N/A"})`
      );
    }
  }

  // 8. CPI check (computed from all semester SPIs)
  if (drive.minCpi !== null && drive.minCpi !== undefined) {
    const spis = student.semesterSpis || [];
    const studentCpi = calculateCpi(spis);

    if (studentCpi === null || studentCpi < drive.minCpi) {
      reasons.push(
        `Minimum CPI requirement not met (required: ${drive.minCpi}, yours: ${studentCpi ?? "N/A"})`
      );
    }
  }

  // 9. 2x salary rule — if student is already placed
  if (student.isPlaced && student.currentPackageLpa) {
    const minRequired = student.currentPackageLpa * 2;
    // Drive CTC: if range, use average; if exact, use ctc
    const driveCTC =
      drive.ctcMax !== null && drive.ctcMax !== undefined
        ? (drive.ctc + drive.ctcMax) / 2
        : drive.ctc;

    if (driveCTC < minRequired) {
      reasons.push(
        `Already placed at ${student.currentPackageLpa} LPA. Only eligible for drives offering >= ${minRequired} LPA (2x rule). This drive offers ${driveCTC} LPA.`
      );
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
    isDismissed: false, // exclude dismissed students
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

  // Drive-level branch filter
  if (drive.allowedBranches && drive.allowedBranches.length > 0) {
    where.branch = { in: drive.allowedBranches };
  }

  // Pre-filter by 10th percentage at DB level
  if (drive.minTenthPercentage) {
    where.tenthPercentage = { gte: drive.minTenthPercentage };
  }

  // Pre-filter by 12th percentage at DB level
  if (drive.minTwelfthPercentage) {
    where.twelfthPercentage = { gte: drive.minTwelfthPercentage };
  }

  // Optional query param filters
  if (filters.branch) {
    const branches = filters.branch.split(",").map((b) => b.trim().toUpperCase());
    where.branch = { in: branches };
  }

  if (filters.minTenth) {
    where.tenthPercentage = { gte: parseFloat(filters.minTenth) };
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { email: true } },
      semesterSpis: { orderBy: { semester: "asc" } },
    },
  });

  // Run eligibility check on each candidate (includes CPI/CGPA/2x rule checks)
  const eligibleStudents = students
    .map((student) => {
      const eligibility = checkStudentEligibility(student, drive);
      const cpi = calculateCpi(student.semesterSpis);
      const cgpa = calculateCgpa(student.semesterSpis);
      return {
        ...student,
        cpi,
        cgpa,
        eligibility,
      };
    })
    .filter((s) => s.eligibility.eligible);

  return eligibleStudents;
};
