import { BranchCode } from "@/config/constants";
import { VerificationStatus } from "./student";

export interface TpoAnalytics {
  totalStudents: number;
  verifiedStudents?: number;
  pendingVerification?: number;
  totalPlaced?: number;
  placedStudents?: number;
  placementPercentage?: number;
  highestPackage?: number;
  averagePackage?: number;
  activeDrives: number;
  companiesCount?: number;
  branchWiseStats?: Record<string, { total: number; placed: number }>;
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
