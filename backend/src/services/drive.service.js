import prisma from "../config/prisma.js";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination.js";

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
  if (!resolvedCompanyId && companyName) {
    const trimmedName = companyName.trim();
    let company = await prisma.company.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" } },
    });
    if (!company) {
      company = await prisma.company.create({
        data: { name: trimmedName },
      });
    }
    resolvedCompanyId = company.id;
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

  const drive = await prisma.recruitmentDrive.create({
    data: {
      companyId: resolvedCompanyId,
      role: finalRole,
      description: description ?? null,
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
      applicationDeadline: finalDeadline ? new Date(finalDeadline) : null,
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
 */
export const getDrives = async (query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);
  const where = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.companyId) {
    where.companyId = query.companyId;
  }
  if (query.allowedStudentType) {
    where.allowedStudentType = query.allowedStudentType;
  }

  // Filter by branches
  if (query.branch) {
    const branches = query.branch.split(",").map((b) => b.trim().toUpperCase());
    where.allowedBranches = { hasSome: branches };
  }

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

  // Parse date if provided
  const updateData = { ...data };
  if (updateData.applicationDeadline) {
    updateData.applicationDeadline = new Date(updateData.applicationDeadline);
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
