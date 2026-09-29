import prisma from "../config/prisma.js";

/**
 * Create a new company (TPO only)
 */
export const createCompany = async (data) => {
  const { name, imageUrl } = data;

  const company = await prisma.company.create({
    data: {
      name,
      imageUrl: imageUrl ?? null,
    },
  });

  return company;
};

/**
 * Get all companies
 */
export const getCompanies = async () => {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { drives: true },
      },
    },
  });

  return companies;
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

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data,
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
