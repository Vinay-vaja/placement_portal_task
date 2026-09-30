import * as companyService from "../services/company.service.js";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";
import { sendSuccess } from "../utils/response.js";

/**
 * POST /api/companies
 * Create a company (TPO only)
 */
export const createCompany = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // If an image file was uploaded via multipart/form-data, upload to Cloudinary
    if (req.file) {
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        "placement_portal/companies"
      );
      data.imageUrl = result.secure_url;
    }

    const company = await companyService.createCompany(data);
    return sendSuccess(res, 201, "Company created successfully", company);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies
 * Get all companies (paginated, any authenticated user)
 */
export const getCompanies = async (req, res, next) => {
  try {
    const result = await companyService.getCompanies(req.query);
    return sendSuccess(res, 200, "Companies retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:id
 * Get a company by ID with its drives
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    return sendSuccess(res, 200, "Company retrieved successfully", company);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/companies/:id
 * Update a company (TPO only)
 */
export const updateCompany = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // If a new image file was uploaded, upload to Cloudinary
    if (req.file) {
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        "placement_portal/companies"
      );
      data.imageUrl = result.secure_url;
    }

    const company = await companyService.updateCompany(req.params.id, data);
    return sendSuccess(res, 200, "Company updated successfully", company);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/companies/:id
 * Delete a company (TPO only)
 */
export const deleteCompany = async (req, res, next) => {
  try {
    await companyService.deleteCompany(req.params.id);
    return sendSuccess(res, 200, "Company deleted successfully");
  } catch (error) {
    next(error);
  }
};
