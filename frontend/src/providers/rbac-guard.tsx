"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { Role } from "@/types";

interface RBACGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function RBACGuard({ children, allowedRoles }: RBACGuardProps) {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, router]);

  if (!isHydrated || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

