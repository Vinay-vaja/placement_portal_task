import { apiClient } from "@/lib/api-client";
import { env } from "@/config/env";
import { useAuthStore } from "@/store/use-auth-store";
import {
  AnnouncementPayload,
  ApiResponse,
  Application,
  EmailLog,
  PaginatedResponse,
  StudentFilterParams,
  StudentProfile,
  TpoAnalytics,
} from "@/types";

export const tpoService = {
  getDashboardStats: async (): Promise<ApiResponse<TpoAnalytics>> => {
    return apiClient.get<ApiResponse<TpoAnalytics>>("/tpo/dashboard");
  },

  getStudents: async (params?: StudentFilterParams): Promise<ApiResponse<PaginatedResponse<StudentProfile>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<StudentProfile>>>("/tpo/students", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  updateStudent: async (
    studentId: string,
    payload: Partial<StudentProfile>
  ): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.put<ApiResponse<StudentProfile>>(`/tpo/students/${studentId}`, payload);
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

  dismissStudent: async (
    studentId: string,
    reason?: string
  ): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.patch<ApiResponse<StudentProfile>>(`/tpo/students/${studentId}/dismiss`, {
      reason,
    });
  },

  reinstateStudent: async (studentId: string): Promise<ApiResponse<StudentProfile>> => {
    return apiClient.patch<ApiResponse<StudentProfile>>(`/tpo/students/${studentId}/reinstate`);
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

  // Email notifications
  notifyDriveApplicants: async (
    driveId: string,
    payload?: { customMessage?: string; target?: "APPLICANTS" | "ELIGIBLE" }
  ): Promise<
    ApiResponse<{
      sent: number;
      failed: number;
      total: number;
      applicantCount?: number;
      eligibleCount?: number;
      message: string;
    }>
  > => {
    return apiClient.post<
      ApiResponse<{
        sent: number;
        failed: number;
        total: number;
        applicantCount?: number;
        eligibleCount?: number;
        message: string;
      }>
    >(`/tpo/drives/${driveId}/notify`, payload || {});
  },

  refactorAnnouncement: async (payload: {
    rawNotes: string;
    templatePreset?: string;
    customApiKey?: string;
    customModel?: string;
  }): Promise<
    ApiResponse<{
      subject: string;
      htmlBody: string;
      modelUsed: string;
    }>
  > => {
    return apiClient.post<
      ApiResponse<{
        subject: string;
        htmlBody: string;
        modelUsed: string;
      }>
    >("/tpo/announcements/refactor", payload);
  },

  sendAnnouncement: async (
    payload: AnnouncementPayload
  ): Promise<ApiResponse<{ count: number; message: string }>> => {
    return apiClient.post<ApiResponse<{ count: number; message: string }>>(
      "/tpo/announcements/send",
      payload
    );
  },

  getEmailLogs: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<EmailLog>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<EmailLog>>>("/tpo/emails", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  getApplications: async (params?: {
    page?: number;
    limit?: number;
    driveId?: string;
    status?: string;
    studentId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Application>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<Application>>>("/tpo/applications", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: "APPLIED" | "SHORTLISTED" | "REJECTED" | "SELECTED"
  ): Promise<ApiResponse<Application>> => {
    return apiClient.patch<ApiResponse<Application>>(`/applications/${applicationId}/status`, {
      status,
    });
  },

  getSettings: async (): Promise<ApiResponse<Record<string, any>>> => {
    return apiClient.get<ApiResponse<Record<string, any>>>("/tpo/settings");
  },

  updateSetting: async (key: string, value: any): Promise<ApiResponse<any>> => {
    return apiClient.patch<ApiResponse<any>>("/tpo/settings", { key, value });
  },

  // Export functions with automatic browser download
  downloadExport: async (endpoint: string, filename: string): Promise<void> => {
    const token = typeof window !== "undefined" ? useAuthStore.getState().token : null;
    const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const fullUrl = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const res = await fetch(fullUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to export data: ${res.statusText}`);
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
  },

  exportStudents: async (
    format: "csv" | "xlsx" = "csv",
    filters?: { search?: string; branch?: string; verificationStatus?: string }
  ): Promise<void> => {
    const dateStr = new Date().toISOString().split("T")[0];
    const queryParams = new URLSearchParams();
    queryParams.set("format", format);
    if (filters?.search) queryParams.set("search", filters.search);
    if (filters?.branch && filters.branch !== "ALL") queryParams.set("branch", filters.branch);
    if (filters?.verificationStatus && filters.verificationStatus !== "ALL") {
      queryParams.set("verificationStatus", filters.verificationStatus);
    }
    await tpoService.downloadExport(
      `/tpo/students/export?${queryParams.toString()}`,
      `ldce_students_${dateStr}.${format}`
    );
  },

  exportDriveApplicants: async (driveId: string, format: "csv" | "xlsx" = "csv"): Promise<void> => {
    await tpoService.downloadExport(
      `/tpo/drives/${driveId}/export?format=${format}`,
      `drive_${driveId}_applicants.${format}`
    );
  },

  exportCompanyWiseStudents: async (
    format: "csv" | "xlsx" = "xlsx",
    params?: { companyId?: string }
  ): Promise<void> => {
    const dateStr = new Date().toISOString().split("T")[0];
    const queryParams = new URLSearchParams();
    queryParams.set("format", format);
    if (params?.companyId && params.companyId !== "ALL") {
      queryParams.set("companyId", params.companyId);
    }
    await tpoService.downloadExport(
      `/tpo/export/company-wise?${queryParams.toString()}`,
      `ldce_company_wise_selections_${dateStr}.${format}`
    );
  },

  exportStudentsUrl: (format: "csv" | "xlsx" = "csv") => {
    const token = typeof window !== "undefined" ? useAuthStore.getState().token : "";
    return `/api/tpo/students/export?format=${format}${token ? `&token=${token}` : ""}`;
  },
};
