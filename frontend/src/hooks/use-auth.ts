"use client";

import { useAuthStore } from "@/store/use-auth-store";
import { authService, LoginPayload, RegisterPayload } from "@/services/auth.service";
import { Role } from "@/types";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { user, token, isAuthenticated, isHydrated, setUser, logout: clearAuthStore } = useAuthStore();
  const router = useRouter();

  const login = async (credentials: LoginPayload) => {
    const response = await authService.login(credentials);
    const resData = response.data;
    if (resData) {
      const { user: userData, token: authToken, profileComplete } = resData;
      const isProfileComplete =
        profileComplete !== undefined
          ? profileComplete
          : userData.student?.profileLocked ?? userData.profileComplete ?? false;

      setUser({ ...userData, profileComplete: isProfileComplete }, authToken);

      if (userData.role === "CENTRAL_TPO") {
        router.push("/tpo/dashboard");
      } else if (isProfileComplete) {
        router.push("/student/drives");
      } else {
        router.push("/student/profile");
      }
    }
    return response;
  };

  const register = async (data: RegisterPayload) => {
    const response = await authService.register(data);
    const resData = response.data;
    if (resData) {
      const { user: userData, token: authToken } = resData;
      setUser({ ...userData, profileComplete: false }, authToken);
      router.push("/student/profile");
    }
    return response;
  };

  const googleAuth = async (idToken: string) => {
    const response = await authService.googleAuth(idToken);
    const resData = response.data;
    if (resData) {
      const { user: userData, token: authToken, profileComplete } = resData;
      const isProfileComplete =
        profileComplete !== undefined
          ? profileComplete
          : userData.student?.profileLocked ?? userData.profileComplete ?? false;

      setUser({ ...userData, profileComplete: isProfileComplete }, authToken);

      if (userData.role === "CENTRAL_TPO") {
        router.push("/tpo/dashboard");
      } else if (isProfileComplete) {
        router.push("/student/drives");
      } else {
        router.push("/student/profile");
      }
    }
    return response;
  };

  const logout = () => {
    clearAuthStore();
    router.push("/login");
  };

  const hasRole = (allowedRoles: Role[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return {
    user,
    token,
    isAuthenticated,
    isHydrated,
    login,
    register,
    googleAuth,
    logout,
    hasRole,
  };
}

