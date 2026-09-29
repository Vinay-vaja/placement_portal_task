import prisma from "../config/prisma.js";

/**
 * Create a new recruitment drive (TPO only)
 */
export const createDrive = async (data) => {
  const {
    companyId,
    role,
    description,
    ctc,
    location,
    minTenthPercentage,
    minTwelfthPercentage,
    minCgpa,
    minCpi,
    allowedStudentType,
    backlogsAllowed,
    applicationDeadline,
    status,
  } = data;

  // Verify company exists
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const drive = await prisma.recruitmentDrive.create({
    data: {
      companyId,
      role,
      description: description ?? null,
      ctc,
      location: location ?? null,
      minTenthPercentage: minTenthPercentage ?? null,
      minTwelfthPercentage: minTwelfthPercentage ?? null,
      minCgpa: minCgpa ?? null,
      minCpi: minCpi ?? null,
      allowedStudentType: allowedStudentType || "ALL",
      backlogsAllowed: backlogsAllowed ?? false,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      status: status || "ACTIVE",
    },
    include: {
      company: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return drive;
};

/**
 * Get all recruitment drives
 */
export const getDrives = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  const drives = await prisma.recruitmentDrive.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, imageUrl: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return drives;
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
