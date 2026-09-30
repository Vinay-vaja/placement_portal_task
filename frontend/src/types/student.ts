import { BranchCode } from "@/config/constants";

export type StudentType = "REGULAR" | "D2D";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface TenthMarks {
  maths: number;
  science: number;
  english: number;
  socialScience: number;
  computerPt: number;
  sanskrit: number;
}

export interface TwelfthMarks {
  physics: number;
  chemistry: number;
  maths: number;
  english: number;
  computerScience?: number;
  computer?: number;
}

export interface SemesterSpi {
  id?: string;
  semester: number;
  spi: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  dob: string;
  branch: BranchCode;
  studentType: StudentType;

  // 10th Marks
  tenthMarks?: TenthMarks;
  tenthPercentage: number;

  // 12th Marks (Regular only)
  twelfthMarks?: TwelfthMarks | null;
  twelfthPercentage?: number | null;

  // D2D Metrics
  d2dCgpa?: number | null;
  d2dAcpcRank?: number | null;

  // Academic computed metrics
  cpi?: number;
  cgpa?: number;
  semesterSpis?: SemesterSpi[];

  // System Flags
  declarationAccepted: boolean;
  isProfileLocked: boolean;
  profileLocked?: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  isPlaced: boolean;
  currentPackageLpa?: number | null;
  isDismissed: boolean;
  dismissalReason?: string | null;

  user?: {
    email: string;
  };

  createdAt: string;
  updatedAt: string;
}
