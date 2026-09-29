import prisma from "../config/prisma.js";
import { checkStudentEligibility } from "./eligibility.service.js";

/**
 * Student applies to a recruitment drive
 * All business rules are enforced here - backend is the final authority
 *
 * @param {string} userId - The authenticated student's userId
 * @param {string} driveId
 */
export const applyToDrive = async (userId, driveId) => {
  // 1. Get student
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Profile must be submitted/locked before applying
  if (!student.profileLocked) {
    const error = new Error(
      "You must submit your profile before applying to drives"
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Get drive
  const drive = await prisma.recruitmentDrive.findUnique({
    where: { id: driveId },
    include: { company: { select: { name: true } } },
  });

  if (!drive) {
    const error = new Error("Recruitment drive not found");
    error.statusCode = 404;
    throw error;
  }

  // 4. Drive must be ACTIVE
  if (drive.status !== "ACTIVE") {
    const error = new Error("This recruitment drive is closed and not accepting applications");
    error.statusCode = 400;
    throw error;
  }

  // 5. Deadline must not have passed
  if (drive.applicationDeadline && new Date() > new Date(drive.applicationDeadline)) {
    const error = new Error("The application deadline for this drive has passed");
    error.statusCode = 400;
    throw error;
  }

  // 6. Check eligibility (backend is final authority - never trust frontend)
  const eligibility = checkStudentEligibility(student, drive);
  if (!eligibility.eligible) {
    const error = new Error("You are not eligible for this drive");
    error.statusCode = 403;
    error.reasons = eligibility.reasons;
    throw error;
  }

  // 7. Check duplicate application
  const existingApplication = await prisma.application.findUnique({
    where: {
      studentId_driveId: {
        studentId: student.id,
        driveId,
      },
    },
  });

  if (existingApplication) {
    const error = new Error("You have already applied to this recruitment drive");
    error.statusCode = 409;
    throw error;
  }

  // 8. Create application
  const application = await prisma.application.create({
    data: {
      studentId: student.id,
      driveId,
      status: "APPLIED",
    },
    include: {
      drive: {
        include: {
          company: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });

  return application;
};

/**
 * Get all applications for the logged-in student
 */
export const getStudentApplications = async (userId) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  const applications = await prisma.application.findMany({
    where: { studentId: student.id },
    include: {
      drive: {
        include: {
          company: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return applications;
};

/**
 * Get all applications (TPO view with filtering)
 */
export const getTpoApplications = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.driveId) {
    where.driveId = filters.driveId;
  }

  if (filters.companyId) {
    where.drive = { companyId: filters.companyId };
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          studentType: true,
          tenthPercentage: true,
          twelfthPercentage: true,
          d2dCgpa: true,
          verificationStatus: true,
          user: { select: { email: true } },
        },
      },
      drive: {
        include: {
          company: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return applications;
};

/**
 * Update application status (TPO only)
 */
export const updateApplicationStatus = async (applicationId, status) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          user: { select: { email: true } },
        },
      },
      drive: {
        include: {
          company: { select: { name: true } },
        },
      },
    },
  });

  return updatedApplication;
};
