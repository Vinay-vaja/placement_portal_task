import prisma from "../config/prisma.js";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination.js";

/**
 * Create a new company (TPO only)
 */
export const createCompany = async (data) => {
  const { name, imageUrl } = data;
  const trimmedName = (name || "").trim();

  if (!trimmedName) {
    const error = new Error("Company name is required");
    error.statusCode = 400;
    throw error;
  }

  // Case-insensitive duplicate check
  const existing = await prisma.company.findFirst({
    where: { name: { equals: trimmedName, mode: "insensitive" } },
  });
  if (existing) {
    const error = new Error(`Company with name "${trimmedName}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  const company = await prisma.company.create({
    data: {
      name: trimmedName,
      imageUrl: imageUrl ?? null,
    },
  });

  return company;
};

/**
 * Get all companies (paginated)
 */
export const getCompanies = async (query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);
  const where = {};

  // Search by company name
  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { drives: true },
        },
      },
      skip,
      take,
    }),
    prisma.company.count({ where }),
  ]);

  return buildPaginatedResponse(companies, total, page, limit);
};

/**
 * Get a single company by ID with its drives
 */
export const getCompanyById = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      drives: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { applications: true } },
        },
      },
    },
  });

  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  return company;
};

/**
 * Update a company (TPO only)
 */
export const updateCompany = async (companyId, data) => {
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  const updateData = { ...data };
  if (updateData.name !== undefined) {
    const trimmedName = updateData.name.trim();
    if (!trimmedName) {
      const error = new Error("Company name cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    const existing = await prisma.company.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        id: { not: companyId },
      },
    });
    if (existing) {
      const error = new Error(`Company with name "${trimmedName}" already exists`);
      error.statusCode = 409;
      throw error;
    }
    updateData.name = trimmedName;
  }

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: updateData,
  });

  return updatedCompany;
};

/**
 * Delete a company (TPO only)
 */
export const deleteCompany = async (companyId) => {
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.company.delete({ where: { id: companyId } });
  return { id: companyId };
};
