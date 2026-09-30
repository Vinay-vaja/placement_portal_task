import { BranchCode } from "@/config/constants";
import { StudentType } from "./student";

export type DriveStatus = "OPEN" | "CLOSED" | "UPCOMING" | "ACTIVE";

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  createdAt: string;
}

export interface RecruitmentDrive {
  id: string;
  companyId?: string;
  companyName?: string;
  company?: Company;
  jobRole?: string;
  role?: string;
  ctcPackage?: string;
  ctc?: number;
  ctcMin?: number;
  ctcMax?: number;
  location: string;
  deadline: string;
  description?: string;
  
  // Eligibility Criteria
  eligibleBranches?: BranchCode[];
  allowedBranches?: BranchCode[];
  allowedStudentType?: "ALL" | StudentType;
  minTenthPercentage?: number;
  minTwelfthPercentage?: number;
  minCpi?: number;
  minCgpa?: number;
  maxActiveBacklogs?: number;
  
  // Rules & Overrides
  maxSelectionsPerStudent?: number;
  tpoAllowMultiple?: boolean;
  
  status: DriveStatus;
  createdAt: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
}

export interface Application {
  id: string;
  studentId: string;
  driveId: string;
  drive?: RecruitmentDrive;
  resumeUrl?: string;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEWED" | "OFFERED" | "REJECTED" | "SELECTED";
  isPresent?: boolean | null;
  createdAt: string;
}
