import prisma from "../config/prisma.js";
import { checkStudentEligibility } from "./eligibility.service.js";
import { uploadPdfToCloudinary } from "../config/cloudinary.js";
import { parsePagination, buildPaginatedResponse, parseSorting } from "../utils/pagination.js";

/**
 * Student applies to a recruitment drive.
 * All business rules are enforced here — backend is the final authority.
 *
 * Requirements:
 * - Profile must be locked
 * - Must not be dismissed
 * - Drive must be ACTIVE and not past deadline
 * - Must pass eligibility check (including 2x salary rule)
 * - Can only apply to 1 role per company (unless tpoAllowMultiple)
 * - Must accept terms
 * - Must upload resume PDF
 *
 * @param {string} userId
 * @param {string} driveId
 * @param {Object} applicationData - { termsAccepted, resumeBuffer }
 */
export const applyToDrive = async (userId, driveId, applicationData) => {
  const { termsAccepted, resumeBuffer } = applicationData;

  // 1. Get student with SPIs for eligibility check
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { semesterSpis: { orderBy: { semester: "asc" } } },
  });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Profile must be submitted/locked
  if (!student.profileLocked) {
    const error = new Error("You must submit your profile before applying to drives");
    error.statusCode = 400;
    throw error;
  }

  // 3. Student must not be dismissed
  if (student.isDismissed) {
    const error = new Error("You have been dismissed from the placement process");
    error.statusCode = 403;
    throw error;
  }

  // 4. Terms must be accepted
  if (!termsAccepted) {
    const error = new Error(
      "You must accept the terms: 'If you cannot participate after applying, you will not be allowed for the upcoming placement journey.'"
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Resume is mandatory
  if (!resumeBuffer) {
    const error = new Error("Resume PDF is required for each application. Please upload a new PDF.");
    error.statusCode = 400;
    throw error;
  }

  // 6. Get drive
  const drive = await prisma.recruitmentDrive.findUnique({
    where: { id: driveId },
    include: { company: { select: { id: true, name: true, imageUrl: true } } },
  });

  if (!drive) {
    const error = new Error("Recruitment drive not found");
    error.statusCode = 404;
    throw error;
  }

  // 7. Drive must be ACTIVE
  if (drive.status !== "ACTIVE") {
    const error = new Error("This recruitment drive is closed and not accepting applications");
    error.statusCode = 400;
    throw error;
  }

  // 8. Deadline must not have passed
  if (drive.applicationDeadline && new Date() > new Date(drive.applicationDeadline)) {
    const error = new Error("The application deadline for this drive has passed");
    error.statusCode = 400;
    throw error;
  }

  // 9. Check duplicate application (checked before eligibility so duplicate returns 409 first)
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

  // 10. Check eligibility (backend is final authority)
  const eligibility = checkStudentEligibility(student, drive);
  if (!eligibility.eligible) {
    const error = new Error("You are not eligible for this drive");
    error.statusCode = 403;
    error.reasons = eligibility.reasons;
    throw error;
  }

  // 11. One-role-per-company check (unless TPO allows multiple)
  if (!drive.tpoAllowMultiple) {
    const companyApplications = await prisma.application.findMany({
      where: {
        studentId: student.id,
        drive: { companyId: drive.companyId },
      },
    });

    if (companyApplications.length >= drive.maxSelectionsPerStudent) {
      const error = new Error(
        `You can only apply to ${drive.maxSelectionsPerStudent} role(s) per company. You have already applied to ${companyApplications.length} role(s) at this company.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // 12. Upload resume PDF to Cloudinary
  let resumeUrl;
  try {
    const result = await uploadPdfToCloudinary(
      resumeBuffer,
      `placement_portal/resumes/${student.id}`
    );
    resumeUrl = result.secure_url;
  } catch (uploadError) {
    const error = new Error("Failed to upload resume. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  // 13. Create application
  const application = await prisma.application.create({
    data: {
      studentId: student.id,
      driveId,
      status: "APPLIED",
      resumeUrl,
      termsAccepted: true,
    },
    include: {
      drive: {
        include: {
          company: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  return application;
};

/**
 * Get all applications for the logged-in student (paginated)
 */
export const getStudentApplications = async (userId, query = {}) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }

  const { skip, take, page, limit } = parsePagination(query);

  const where = { studentId: student.id };
  if (query.status) {
    where.status = query.status;
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        drive: {
          include: {
            company: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
      skip,
      take,
    }),
    prisma.application.count({ where }),
  ]);

  return buildPaginatedResponse(applications, total, page, limit);
};

/**
 * Get all applications (TPO view with filtering and pagination)
 */
export const getTpoApplications = async (query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);
  const where = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.driveId) {
    where.driveId = query.driveId;
  }
  if (query.companyId) {
    where.drive = { companyId: query.companyId };
  }
  if (query.studentId) {
    where.studentId = query.studentId;
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            branch: true,
            studentType: true,
            tenthPercentage: true,
            twelfthPercentage: true,
            d2dCgpa: true,
            verificationStatus: true,
            isPlaced: true,
            currentPackageLpa: true,
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
      skip,
      take,
    }),
    prisma.application.count({ where }),
  ]);

  return buildPaginatedResponse(applications, total, page, limit);
};

/**
 * Update application status (TPO only)
 * Transitions: APPLIED -> SHORTLISTED -> SELECTED/REJECTED
 * When SELECTED: updates student's placement status and currentPackageLpa
 */
export const updateApplicationStatus = async (applicationId, status) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      drive: true,
      student: true,
    },
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  // If status is SELECTED, also update student's placement tracking
  const updateOperations = [
    prisma.application.update({
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
    }),
  ];

  if (status === "SELECTED") {
    // Current drive offer package
    const drive = application.drive;
    const thisPackageLpa =
      drive.ctcMax !== null && drive.ctcMax !== undefined
        ? (drive.ctc + drive.ctcMax) / 2
        : drive.ctc;

    // Find all other selected offers for this student to determine the highest package
    const otherSelected = await prisma.application.findMany({
      where: {
        studentId: application.studentId,
        status: "SELECTED",
        id: { not: applicationId },
      },
      include: {
        drive: { select: { ctc: true, ctcMax: true } },
      },
    });

    const allPackages = [
      thisPackageLpa,
      ...otherSelected.map((a) =>
        a.drive.ctcMax ? (a.drive.ctc + a.drive.ctcMax) / 2 : a.drive.ctc
      ),
    ];
    const highestPackage = Math.max(...allPackages);

    updateOperations.push(
      prisma.student.update({
        where: { id: application.studentId },
        data: {
          isPlaced: true,
          currentPackageLpa: highestPackage,
        },
      })
    );
  }

  const results = await prisma.$transaction(updateOperations);
  return results[0]; // Return the updated application
};

/**
 * Mark attendance for a single application (TPO only)
 */
export const markAttendance = async (applicationId, isPresent) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          isPlaced: true,
          currentPackageLpa: true,
          applications: {
            where: { status: "SELECTED" },
            select: { id: true },
          },
        },
      },
      drive: {
        include: { company: { select: { name: true } } },
      },
    },
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    attendanceMarked: true,
    isPresent,
  };

  // If student is absent, record dismissed on this application
  if (!isPresent) {
    updateData.dismissedFromPlacement = true;
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: updateData,
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          user: { select: { email: true } },
        },
      },
      drive: {
        include: { company: { select: { name: true } } },
      },
    },
  });

  // Policy rule:
  // If absent and already placed in another company: "that's okay" (no global debarment, keeps placed job),
  // but cannot apply to new drives unless 2x salary rule is satisfied.
  // If absent and NOT placed anywhere: dismissed from placement.
  if (!isPresent) {
    const isAlreadyPlaced =
      application.student.isPlaced || application.student.applications.length > 0;

    if (!isAlreadyPlaced) {
      await prisma.student.update({
        where: { id: application.studentId },
        data: {
          isDismissed: true,
          dismissalReason: `Absent from drive: ${updatedApplication.drive.role} at ${updatedApplication.drive.company.name}`,
        },
      });
    }
  }

  return updatedApplication;
};

/**
 * Bulk mark attendance for a drive (TPO only)
 */
export const bulkMarkAttendance = async (driveId, studentIds, isPresent) => {
  // Find all applications for this drive for the given students
  const applications = await prisma.application.findMany({
    where: {
      driveId,
      student: { id: { in: studentIds } },
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          isPlaced: true,
          applications: {
            where: { status: "SELECTED" },
            select: { id: true },
          },
        },
      },
    },
  });

  if (applications.length === 0) {
    const error = new Error("No applications found for the specified students and drive");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    attendanceMarked: true,
    isPresent,
  };

  if (!isPresent) {
    updateData.dismissedFromPlacement = true;
  }

  // Update all applications
  const updates = applications.map((app) =>
    prisma.application.update({
      where: { id: app.id },
      data: updateData,
    })
  );

  // If absent, only dismiss students who do NOT already hold a placement offer
  if (!isPresent) {
    const absentUnplacedStudentIds = applications
      .filter((app) => !app.student.isPlaced && app.student.applications.length === 0)
      .map((app) => app.student.id);

    if (absentUnplacedStudentIds.length > 0) {
      updates.push(
        prisma.student.updateMany({
          where: { id: { in: absentUnplacedStudentIds } },
          data: {
            isDismissed: true,
            dismissalReason: "Absent from recruitment drive without prior approval",
          },
        })
      );
    }
  }

  await prisma.$transaction(updates);

  return {
    updated: applications.length,
    isPresent,
    studentIds: applications.map((a) => a.studentId),
  };
};
