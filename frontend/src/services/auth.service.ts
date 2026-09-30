import { apiClient } from "@/lib/api-client";
import { ApiResponse, User } from "@/types";

export interface AuthResponseData {
  token: string;
  user: User;
  profileComplete?: boolean;
  isNewUser?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dob: string;
  studentType?: "REGULAR" | "D2D";
}

export const authService = {
  login: async (credentials: LoginPayload): Promise<ApiResponse<AuthResponseData>> => {
    return apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", credentials);
  },

  register: async (data: RegisterPayload): Promise<ApiResponse<AuthResponseData>> => {
    return apiClient.post<ApiResponse<AuthResponseData>>("/auth/register", data);
  },

  googleAuth: async (idToken: string): Promise<ApiResponse<AuthResponseData>> => {
    return apiClient.post<ApiResponse<AuthResponseData>>("/auth/google", { idToken });
  },
};

