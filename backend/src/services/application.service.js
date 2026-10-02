import http from "http";
import https from "https";
import prisma from "../config/prisma.js";
import { checkStudentEligibility } from "./eligibility.service.js";
import cloudinary, { uploadPdfToCloudinary } from "../config/cloudinary.js";
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

  // 0. Check global TPO setting: placement_active
  const placementSetting = await prisma.tpoSetting.findUnique({
    where: { key: "placement_active" },
  });
  if (placementSetting) {
    let isActive = true;
    try {
      isActive = typeof placementSetting.value === "boolean" ? placementSetting.value : JSON.parse(placementSetting.value);
    } catch {
      isActive = placementSetting.value === "true";
    }
    if (!isActive) {
      const error = new Error("Campus placement drive applications are currently paused by the Central TPO cell");
      error.statusCode = 403;
      throw error;
    }
  }

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

  const appUpdateData = { status };
  if (status !== "APPLIED") {
    // When an applicant moves to any next round/stage, default attendance to Present
    appUpdateData.isPresent = true;
  }

  // If status is SELECTED, also update student's placement tracking
  const updateOperations = [
    prisma.application.update({
      where: { id: applicationId },
      data: appUpdateData,
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
  } else if (application.status === "SELECTED" && status !== "SELECTED") {
    // Application was previously SELECTED, now demoted or revoked.
    // Recalculate remaining offers or revoke placement status if no offers remain.
    const remainingSelected = await prisma.application.findMany({
      where: {
        studentId: application.studentId,
        status: "SELECTED",
        id: { not: applicationId },
      },
      include: {
        drive: { select: { ctc: true, ctcMax: true } },
      },
    });

    if (remainingSelected.length > 0) {
      const remainingPackages = remainingSelected.map((a) =>
        a.drive.ctcMax ? (a.drive.ctc + a.drive.ctcMax) / 2 : a.drive.ctc
      );
      const newHighest = Math.max(...remainingPackages);
      updateOperations.push(
        prisma.student.update({
          where: { id: application.studentId },
          data: {
            isPlaced: true,
            currentPackageLpa: newHighest,
          },
        })
      );
    } else {
      updateOperations.push(
        prisma.student.update({
          where: { id: application.studentId },
          data: {
            isPlaced: false,
            currentPackageLpa: null,
          },
        })
      );
    }
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

/**
 * Stream application resume PDF securely to the client.
 *
 * Authorization Rules:
 * - CENTRAL_TPO can view applicant resumes.
 * - Student can view their own resume (application.student.userId === user.userId).
 * - Other users / students get 403 Forbidden.
 *
 * @param {string} applicationId
 * @param {Object} user - { userId, role }
 * @param {Object} res - Express response object
 */
export const getResumeStream = async (applicationId, user, res) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: { select: { id: true, userId: true } },
    },
  });

  if (!application) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }

  if (!application.resumeUrl) {
    const error = new Error("No resume uploaded for this application");
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  const isStudentOwner =
    user.role === "STUDENT" && application.student.userId === user.userId;
  const isCentralTpo = user.role === "CENTRAL_TPO";

  if (!isStudentOwner && !isCentralTpo) {
    const error = new Error("Access denied: You are not authorized to view this resume");
    error.statusCode = 403;
    throw error;
  }

  // Set response headers for inline PDF rendering
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="Student_Resume.pdf"');
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

  // Parse Cloudinary URL parameters to build authenticated private download URL
  const urlParts = application.resumeUrl.split("/upload/");
  if (urlParts.length !== 2) {
    const error = new Error("Invalid resume URL structure");
    error.statusCode = 500;
    throw error;
  }

  const isRaw = urlParts[0].endsWith("/raw");
  const resourceType = isRaw ? "raw" : "image";
  const pathAfterUpload = urlParts[1].replace(/^v\d+\//, "");
  const extMatch = pathAfterUpload.match(/\.([^.]+)$/);
  const format = isRaw ? (extMatch ? extMatch[1] : "") : (extMatch ? extMatch[1] : "pdf");
  const publicId = isRaw ? pathAfterUpload : pathAfterUpload.replace(/\.[^.]+$/, "");

  // Generate authenticated private download URL using Cloudinary SDK
  const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "upload",
    attachment: false,
  });

  return new Promise((resolve, reject) => {
    const client = downloadUrl.startsWith("https") ? https : http;

    const req = client.get(downloadUrl, (cloudinaryRes) => {
      if (cloudinaryRes.statusCode === 200) {
        cloudinaryRes.pipe(res);
        return resolve();
      }
      const err = new Error(`Cloudinary delivery failed with status ${cloudinaryRes.statusCode}`);
      err.statusCode = cloudinaryRes.statusCode;
      reject(err);
    });

    req.on("error", (err) => {
      if (!res.headersSent) {
        const error = new Error("Failed to retrieve resume document from storage");
        error.statusCode = 500;
        reject(error);
      }
    });
  });
};


