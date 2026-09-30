import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse, RecruitmentDrive, TpoAnalytics } from "@/types";

export const placementService = {
  getStats: async (): Promise<ApiResponse<TpoAnalytics>> => {
    return apiClient.get<ApiResponse<TpoAnalytics>>("/tpo/dashboard");
  },

  getJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<RecruitmentDrive>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<RecruitmentDrive>>>("/drives", {
      params,
    });
  },

  getJobById: async (id: string): Promise<ApiResponse<RecruitmentDrive>> => {
    return apiClient.get<ApiResponse<RecruitmentDrive>>(`/drives/${id}`);
  },
};
