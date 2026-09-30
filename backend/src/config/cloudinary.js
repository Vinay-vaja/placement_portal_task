import { v2 as cloudinary } from "cloudinary";
import { config } from "./env.js";

// Configure Cloudinary SDK
if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  });
}

/**
 * Upload an in-memory buffer to Cloudinary (images)
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<Object>} Cloudinary upload response object
 */
export const uploadBufferToCloudinary = (
  buffer,
  folder = "placement_portal/companies"
) => {
  return new Promise((resolve, reject) => {
    if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
      const error = new Error("Cloudinary credentials are not configured in environment variables");
      error.statusCode = 500;
      return reject(error);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload a PDF buffer to Cloudinary
 * @param {Buffer} buffer - PDF file buffer from multer
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<Object>} Cloudinary upload response object
 */
export const uploadPdfToCloudinary = (
  buffer,
  folder = "placement_portal/resumes"
) => {
  return new Promise((resolve, reject) => {
    if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
      const error = new Error("Cloudinary credentials are not configured in environment variables");
      error.statusCode = 500;
      return reject(error);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        format: "pdf",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

export default cloudinary;
