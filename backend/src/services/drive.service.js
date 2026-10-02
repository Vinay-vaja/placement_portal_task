import prisma from "../config/prisma.js";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination.js";
import { checkStudentEligibility } from "./eligibility.service.js";

/**
 * Normalize a deadline date string to end-of-day (23:59:59.999).
 * Date-only inputs like "2026-10-15" default to midnight start (00:00:00),
 * which means the drive effectively closes at the START of the deadline day.
 * This ensures the drive remains open for the entire deadline day.
 */
function normalizeDeadlineToEndOfDay(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  // If it looks like a date-only string (no time component), set to end-of-day
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
}

/**
 * Create a new recruitment drive (TPO only)
 */
export const createDrive = async (data) => {
  let {
    companyId,
    companyName,
    role,
    jobRole,
    description,
    ctc,
    minLpa,
    ctcMax,
    maxLpa,
    location,
    minTenthPercentage,
    minTwelfthPercentage,
    minCgpa,
    minCpi,
    allowedStudentType,
    allowedBranches,
    eligibleBranches,
    backlogsAllowed,
    applicationDeadline,
    deadline,
    status,
    maxSelectionsPerStudent,
    tpoAllowMultiple,
    roundDetails,
  } = data;

  // Resolve company: either by companyId or by companyName
  let resolvedCompanyId = companyId;
  const logoUrl = (data.companyLogo || data.imageUrl || data.companyImageUrl || "").trim() || null;

  if (!resolvedCompanyId && companyName) {
    const trimmedName = companyName.trim();
    let company = await prisma.company.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" } },
    });
    if (!company) {
      company = await prisma.company.create({
        data: { name: trimmedName, imageUrl: logoUrl },
      });
    } else if (logoUrl) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: { imageUrl: logoUrl },
      });
    }
    resolvedCompanyId = company.id;
  } else if (resolvedCompanyId && logoUrl) {
    await prisma.company.update({
      where: { id: resolvedCompanyId },
      data: { imageUrl: logoUrl },
    });
  }

  if (!resolvedCompanyId) {
    const error = new Error("Company ID or valid Company Name is required");
    error.statusCode = 400;
    throw error;
  }

  // Verify company exists
  const company = await prisma.company.findUnique({ where: { id: resolvedCompanyId } });
  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const finalRole = (role || jobRole || "").trim();
  const finalCtc = ctc !== undefined && ctc !== null ? Number(ctc) : Number(minLpa);
  const finalCtcMax = ctcMax !== undefined && ctcMax !== null && ctcMax !== ""
    ? Number(ctcMax)
    : (maxLpa !== undefined && maxLpa !== null && maxLpa !== "" ? Number(maxLpa) : null);
  const finalBranches = allowedBranches || eligibleBranches || [];
  const finalDeadline = applicationDeadline || deadline;

  // Handle optional brochure link
  let finalDescription = description ?? null;
  const brochure = (data.brochureUrl || data.brochureLink || "").trim();
  if (brochure) {
    finalDescription = finalDescription
      ? `${finalDescription}\n\n📄 Company Brochure & Documents: ${brochure}`
      : `📄 Company Brochure & Documents: ${brochure}`;
  }

  const drive = await prisma.recruitmentDrive.create({
    data: {
      companyId: resolvedCompanyId,
      role: finalRole,
      description: finalDescription,
      ctc: finalCtc,
      ctcMax: finalCtcMax,
      location: location ?? null,
      minTenthPercentage: minTenthPercentage !== undefined && minTenthPercentage !== null && minTenthPercentage !== "" ? Number(minTenthPercentage) : null,
      minTwelfthPercentage: minTwelfthPercentage !== undefined && minTwelfthPercentage !== null && minTwelfthPercentage !== "" ? Number(minTwelfthPercentage) : null,
      minCgpa: minCgpa !== undefined && minCgpa !== null && minCgpa !== "" ? Number(minCgpa) : null,
      minCpi: minCpi !== undefined && minCpi !== null && minCpi !== "" ? Number(minCpi) : null,
      allowedStudentType: allowedStudentType || "ALL",
      allowedBranches: finalBranches,
      backlogsAllowed: backlogsAllowed ?? false,
      applicationDeadline: finalDeadline ? normalizeDeadlineToEndOfDay(finalDeadline) : null,
      status: status || "ACTIVE",
      maxSelectionsPerStudent: maxSelectionsPerStudent ? Number(maxSelectionsPerStudent) : 1,
      tpoAllowMultiple: tpoAllowMultiple ?? false,
      roundDetails: roundDetails ?? null,
    },
    include: {
      company: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return drive;
};

/**
 * Get all recruitment drives (paginated with filters)
 * If accessed by a STUDENT, filters drives using checkStudentEligibility()
 * so the student ONLY sees drives they are qualified for.
 */
export const getDrives = async (query = {}, userId = null, userRole = null) => {
  const { skip, take, page, limit } = parsePagination(query);
  const where = {};

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  } else if (userRole === "STUDENT" && !query.status) {
    // By default, students only see active recruitment drives unless explicitly requested
    where.status = "ACTIVE";
  }
  if (query.companyId) {
    where.companyId = query.companyId;
  }
  if (query.allowedStudentType && query.allowedStudentType !== "ALL") {
    where.allowedStudentType = query.allowedStudentType;
  }

  // Filter by branches
  if (query.branch && query.branch !== "ALL") {
    const branches = query.branch.split(",").map((b) => b.trim().toUpperCase());
    where.allowedBranches = { hasSome: branches };
  }

  // STUDENT-specific eligibility filtering
  if (userRole === "STUDENT" && userId) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { semesterSpis: { orderBy: { semester: "asc" } } },
    });

    // If student record does not exist in DB -> return 0 drives
    if (!student) {
      return buildPaginatedResponse([], 0, page, limit);
    }

    // Exclude drives student has already applied to unless includeApplied is requested
    const studentApps = await prisma.application.findMany({
      where: { studentId: student.id },
      select: { driveId: true },
    });
    const appliedDriveIds = studentApps.map((a) => a.driveId);
    if (query.includeApplied !== "true" && appliedDriveIds.length > 0) {
      where.id = { notIn: appliedDriveIds };
    }

    // Fetch candidate drives matching base filters and evaluate eligibility for each
    const [candidateDrives, total] = await Promise.all([
      prisma.recruitmentDrive.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, imageUrl: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.recruitmentDrive.count({ where }),
    ]);

    // Attach authoritative eligibility results { eligible: boolean, reasons: string[] }
    const drivesWithEligibility = candidateDrives.map((drive) => {
      const eligibilityResult = checkStudentEligibility(student, drive);
      return {
        ...drive,
        eligibility: {
          eligible: eligibilityResult.eligible,
          reasons: eligibilityResult.reasons,
        },
      };
    });

    return buildPaginatedResponse(drivesWithEligibility, total, page, limit);
  }

  // Default path for non-STUDENT users (e.g. CENTRAL_TPO)
  const [drives, total] = await Promise.all([
    prisma.recruitmentDrive.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, imageUrl: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.recruitmentDrive.count({ where }),
  ]);

  return buildPaginatedResponse(drives, total, page, limit);
};

/**
 * Get a single recruitment drive by ID
 */
export const getDriveById = async (driveId) => {
  const drive = await prisma.recruitmentDrive.findUnique({
    where: { id: driveId },
    include: {
      company: { select: { id: true, name: true, imageUrl: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!drive) {
    const error = new Error("Recruitment drive not found");
    error.statusCode = 404;
    throw error;
  }

  return drive;
};

/**
 * Update a recruitment drive (TPO only)
 */
export const updateDrive = async (driveId, data) => {
  const drive = await prisma.recruitmentDrive.findUnique({ where: { id: driveId } });

  if (!drive) {
    const error = new Error("Recruitment drive not found");
    error.statusCode = 404;
    throw error;
  }

  // Extract companyLogo so it's NOT passed to prisma.recruitmentDrive.update
  const { companyLogo, companyName, ...driveData } = data;

  const updateData = { ...driveData };

  // Parse date if provided
  if (updateData.applicationDeadline) {
    updateData.applicationDeadline = new Date(updateData.applicationDeadline);
  }
  if (updateData.deadline) {
    updateData.applicationDeadline = new Date(updateData.deadline);
    delete updateData.deadline;
  }
  if (updateData.role || updateData.jobRole) {
    updateData.role = updateData.role || updateData.jobRole;
    delete updateData.jobRole;
  }
  if (updateData.ctc || updateData.minLpa) {
    updateData.ctc = updateData.ctc ? Number(updateData.ctc) : Number(updateData.minLpa);
    delete updateData.minLpa;
  }
  if (updateData.ctcMax !== undefined || updateData.maxLpa !== undefined) {
    const ctcMaxVal = updateData.ctcMax !== undefined ? updateData.ctcMax : updateData.maxLpa;
    updateData.ctcMax = ctcMaxVal !== null && ctcMaxVal !== "" && ctcMaxVal !== undefined ? Number(ctcMaxVal) : null;
    delete updateData.maxLpa;
  }

  // Update Company imageUrl if companyLogo was explicitly provided (non-undefined and non-null)
  const logoUrl = typeof companyLogo === "string" ? companyLogo.trim() : companyLogo;
  if (logoUrl !== undefined && logoUrl !== null && drive.companyId) {
    const finalLogo = logoUrl || null;
    await prisma.company.update({
      where: { id: drive.companyId },
      data: { imageUrl: finalLogo },
    });
  }

  const updatedDrive = await prisma.recruitmentDrive.update({
    where: { id: driveId },
    data: updateData,
    include: {
      company: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return updatedDrive;
};

/**
 * Delete a recruitment drive (TPO only)
 */
export const deleteDrive = async (driveId) => {
  const drive = await prisma.recruitmentDrive.findUnique({ where: { id: driveId } });

  if (!drive) {
    const error = new Error("Recruitment drive not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.recruitmentDrive.delete({ where: { id: driveId } });
  return { id: driveId };
};

/**
 * Check student eligibility for a specific drive
 */
export const checkEligibilityForStudent = async (userId, driveId) => {
  const drive = await prisma.recruitmentDrive.findUnique({
    where: { id: driveId },
    include: {
      company: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  if (!drive) {
    const error = new Error("Recruitment drive not found");
    error.statusCode = 404;
    throw error;
  }

  const student = await prisma.student.findUnique({
    where: { userId },
    include: { semesterSpis: { orderBy: { semester: "asc" } } },
  });

  if (!student) {
    return {
      eligible: false,
      isEligible: false,
      reasons: ["Student profile not found. Please complete your registration."],
    };
  }

  const result = checkStudentEligibility(student, drive);
  return {
    ...result,
    isEligible: result.eligible,
  };
};
