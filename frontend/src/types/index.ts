export * from "./api";
export * from "./student";
export * from "./drive";
export * from "./tpo";

export type Role = "STUDENT" | "CENTRAL_TPO";

export interface StudentAuthInfo {
  id: string;
  fullName: string;
  phone?: string;
  dob?: string;
  branch?: string;
  studentType?: "REGULAR" | "D2D";
  profileLocked?: boolean;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  isDismissed?: boolean;
  isPlaced?: boolean;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  authProvider?: string;
  profileComplete?: boolean;
  student?: StudentAuthInfo;
  createdAt?: string;
}

