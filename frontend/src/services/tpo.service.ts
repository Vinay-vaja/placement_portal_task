import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResponse, StudentFilterParams, StudentProfile, TpoAnalytics } from "@/types";

export const tpoService = {
  getDashboardStats: async (): Promise<ApiResponse<TpoAnalytics>> => {
    return apiClient.get<ApiResponse<TpoAnalytics>>("/tpo/dashboard");
  },

  getStudents: async (params?: StudentFilterParams): Promise<ApiResponse<PaginatedResponse<StudentProfile>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<StudentProfile>>>("/tpo/students", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  verifyStudent: async (
    studentId: string,
    status: "PENDING" | "VERIFIED" | "REJECTED",
    rejectionReason?: string
  ): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.patch<ApiResponse<StudentProfile>>(`/tpo/students/${studentId}/verify`, {
      verificationStatus: status,
      status,
      rejectionReason,
    });
  },

  toggleDismissStudent: async (
    studentId: string,
    isDismissed: boolean,
    dismissalReason?: string
  ): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.patch<ApiResponse<StudentProfile>>(`/tpo/students/${studentId}/dismiss`, {
      isDismissed,
      dismissalReason,
    });
  },

  markAttendance: async (
    applicationId: string,
    isPresent: boolean
  ): Promise<ApiResponse<{ id: string; isPresent: boolean }>> => {
    return apiClient.patch<ApiResponse<{ id: string; isPresent: boolean }>>(
      `/tpo/applications/${applicationId}/attendance`,
      { isPresent }
    );
  },

  notifyDriveApplicants: async (driveId: string): Promise<ApiResponse<{ count: number }>> => {
    return apiClient.post<ApiResponse<{ count: number }>>(`/tpo/drives/${driveId}/notify`);
  },

  exportStudentsUrl: (format: "csv" | "xlsx" = "csv") => {
    return `/api/tpo/students/export?format=${format}`;
  },
};
