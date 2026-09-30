"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlToken = searchParams.get("token");

    const sessionEmail = typeof window !== "undefined" ? sessionStorage.getItem("pw_reset_email") : null;
    const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("pw_reset_token") : null;

    const finalEmail = urlEmail || sessionEmail || "";
    const finalToken = urlToken || sessionToken || "";

    setEmail(finalEmail);
    setResetToken(finalToken);

    if (!finalToken) {
      setError("No valid password reset session found. Please request a new verification code.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError("Missing reset authorization. Please request a new verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        resetToken,
        newPassword,
      });

      setIsSuccess(true);
      // Clean up session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pw_reset_email");
        sessionStorage.removeItem("pw_reset_token");
      }

      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try requesting a new OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-4 py-12 selection:bg-[#0071E3]/20">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Mark */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071E3] text-white shadow-sm shadow-[#0071E3]/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Placement Portal
          </h1>
          <p className="text-xs text-[#86868B] font-normal">
            L.D. College of Engineering • Ahmedabad
          </p>
        </div>

        {/* Card */}
        <Card className="border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] bg-white rounded-3xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-xl font-semibold text-[#1D1D1F]">
              Create New Password
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              {email ? `Setting a fresh password for ${email}` : "Choose a secure password for your account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-red-50/80 p-3 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="space-y-4 py-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">Password Reset Complete!</h3>
                  <p className="text-xs text-[#86868B]">
                    Your account has been secured with your new password. Redirecting to sign in...
                  </p>
                </div>
                <Link href="/login" className="block pt-2">
                  <Button variant="primary" className="w-full text-xs h-10">
                    Sign In Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : !resetToken ? (
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-[#86868B]">
                  No reset token detected. Please start by requesting a verification code.
                </p>
                <Link href="/forgot-password" className="block">
                  <Button variant="primary" className="w-full text-xs h-10">
                    Go to Verification
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                    <Input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      className="pl-10 text-xs sm:text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                    <Input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      className="pl-10 text-xs sm:text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-medium mt-3 h-11 text-xs sm:text-sm"
                  isLoading={isLoading}
                >
                  Save New Password
                </Button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-black/[0.06]">
              <Link
                href="/login"
                className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                Cancel and return to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] text-xs text-[#86868B]">
          Loading reset session...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
