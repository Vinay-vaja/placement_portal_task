import { BranchCode } from "@/config/constants";
import { VerificationStatus } from "./student";

export interface TpoAnalytics {
  totalStudents: number;
  verifiedStudents?: number;
  pendingVerification?: number;
  rejectedStudents?: number;
  totalPlaced?: number;
  placedStudents?: number;
  placementPercentage?: number;
  placementRate?: number;
  highestPackage?: number;
  lowestPackage?: number;
  averagePackage?: number;
  medianPackage?: number;
  activeDrives: number;
  totalCompanies?: number;
  companiesCount?: number;
  totalApplications?: number;
  attendanceRate?: number;

  students?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    placed: number;
    dismissed: number;
    byBranch: Record<string, number>;
    byType: Record<string, number>;
  };
  companies?: {
    total: number;
    activeDrives: number;
    closedDrives: number;
  };
  applications?: {
    total: number;
    byStatus: Record<string, number>;
    attendanceRate: number;
  };
  packages?: {
    highest: number;
    lowest: number;
    average: number;
    median: number;
    salaryTiers?: {
      dream: { count: number };
      core: { count: number };
      standard: { count: number };
    };
    companyWise: Array<{
      company: string;
      companyId?: string;
      avgPackage: number;
      studentsHired: number;
      details: Array<{
        id?: string;
        name: string;
        email?: string | null;
        branch?: string | null;
        studentType?: string | null;
        role: string;
        package: number;
      }>;
    }>;
    branchWise: Array<{
      branch: string;
      avgPackage: number;
      placed: number;
    }>;
  };
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  emailType: string;
  status: "SENT" | "FAILED";
  errorMessage?: string | null;
  driveId?: string | null;
  announcementId?: string | null;
  createdAt: string;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  driveId?: string;
  branch?: string;
  studentType?: string;
}

export interface StudentFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  branch?: string;
  minTenth?: number;
  minCpi?: number;
  verificationStatus?: VerificationStatus;
  isPlaced?: boolean;
  isDismissed?: boolean;
}
