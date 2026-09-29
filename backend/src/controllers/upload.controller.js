import { uploadBufferToCloudinary } from "../config/cloudinary.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/upload/image
 * Upload a single image to Cloudinary and return the URL
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "No image file provided");
    }

    const folder = req.body.folder || "placement_portal/general";
    const result = await uploadBufferToCloudinary(req.file.buffer, folder);

    return sendSuccess(res, 200, "Image uploaded successfully", {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    next(error);
  }
};
