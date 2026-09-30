import { apiClient } from "@/lib/api-client";
import { ApiResponse, Application, SemesterSpi, StudentProfile } from "@/types";

export const studentService = {
  getProfile: async (): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.get<ApiResponse<StudentProfile>>("/students/me");
  },

  completeProfile: async (data: Partial<StudentProfile>): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.post<ApiResponse<StudentProfile>>("/students/complete-profile", data);
  },

  addOrUpdateSpi: async (payload: { semester: number; spi: number }): Promise<ApiResponse<SemesterSpi[]>> => {
    return apiClient.post<ApiResponse<SemesterSpi[]>>("/students/spi", payload);
  },

  getSpis: async (): Promise<ApiResponse<{ spis: SemesterSpi[]; cpi: number; cgpa: number }>> => {
    return apiClient.get<ApiResponse<{ spis: SemesterSpi[]; cpi: number; cgpa: number }>>("/students/spi");
  },

  getApplications: async (): Promise<ApiResponse<Application[]>> => {
    return apiClient.get<ApiResponse<Application[]>>("/students/applications");
  },
};
