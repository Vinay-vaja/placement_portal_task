import { apiClient } from "@/lib/api-client";
import { ApiResponse, Application, EligibilityResult, PaginatedResponse, RecruitmentDrive, StudentProfile } from "@/types";

export const driveService = {
  getDrives: async (params?: {
    page?: number;
    limit?: number;
    branch?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<RecruitmentDrive>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<RecruitmentDrive>>>("/drives", { params });
  },

  createDrive: async (data: Partial<RecruitmentDrive>): Promise<ApiResponse<RecruitmentDrive>> => {
    return apiClient.post<ApiResponse<RecruitmentDrive>>("/drives", data);
  },

  checkEligibility: async (driveId: string): Promise<ApiResponse<EligibilityResult>> => {
    return apiClient.get<ApiResponse<EligibilityResult>>(`/drives/${driveId}/eligibility`);
  },

  getEligibleStudents: async (driveId: string): Promise<ApiResponse<StudentProfile[]>> => {
    return apiClient.get<ApiResponse<StudentProfile[]>>(`/drives/${driveId}/eligible-students`);
  },

  applyToDrive: async (driveId: string, formData: FormData): Promise<ApiResponse<Application>> => {
    return apiClient.post<ApiResponse<Application>>(`/drives/${driveId}/apply`, formData);
  },
};
