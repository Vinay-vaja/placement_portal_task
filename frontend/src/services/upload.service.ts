import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";

export interface UploadImageResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export const uploadService = {
  /**
   * Upload an image file to Cloudinary
   * @param file The image File to upload
   * @param folder Destination Cloudinary folder (default: placement_portal/companies)
   */
  uploadImage: async (
    file: File,
    folder = "placement_portal/companies"
  ): Promise<ApiResponse<UploadImageResult>> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    return apiClient.post<ApiResponse<UploadImageResult>>("/upload/image", formData);
  },
};
