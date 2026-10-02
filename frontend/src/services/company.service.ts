import { apiClient } from "@/lib/api-client";
import { ApiResponse, Company, PaginatedResponse } from "@/types";

export const companyService = {
  getCompanies: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Company>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<Company>>>("/companies", { params });
  },

  getCompanyById: async (id: string): Promise<ApiResponse<Company>> => {
    return apiClient.get<ApiResponse<Company>>(`/companies/${id}`);
  },

  createCompany: async (formData: FormData): Promise<ApiResponse<Company>> => {
    return apiClient.post<ApiResponse<Company>>("/companies", formData, {
      headers: {
        // Let browser set multipart boundary
      },
    });
  },

  updateCompany: async (id: string, formData: FormData | Partial<Company>): Promise<ApiResponse<Company>> => {
    return apiClient.put<ApiResponse<Company>>(`/companies/${id}`, formData);
  },

  deleteCompany: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    return apiClient.delete<ApiResponse<{ id: string }>>(`/companies/${id}`);
  },
};
