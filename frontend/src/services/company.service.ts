import { apiClient } from "@/lib/api-client";
import { ApiResponse, Company, PaginatedResponse } from "@/types";

export const companyService = {
  getCompanies: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Company>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<Company>>>("/companies", { params });
  },

  createCompany: async (formData: FormData): Promise<ApiResponse<Company>> => {
    return apiClient.post<ApiResponse<Company>>("/companies", formData, {
      headers: {
        // Let browser set multipart boundary
      },
    });
  },
};
