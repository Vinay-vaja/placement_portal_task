"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { CollegeLogo } from "@/components/shared/college-logo";
import { Lock, Mail, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(values);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-4 py-12 selection:bg-[#0071E3]/20">
      <div className="w-full max-w-sm space-y-6">
        {/* Apple-style brand mark */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <CollegeLogo size={64} showText={false} />
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Placement Portal
          </h1>
          <p className="text-xs text-[#86868B] font-normal">
            L.D. College of Engineering • Ahmedabad
          </p>
        </div>

        {/* Minimal Login Card */}
        <Card className="border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] bg-white rounded-3xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-xl font-semibold text-[#1D1D1F]">Sign In</CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Enter your credentials to continue to your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-red-50/80 p-3 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1D1D1F]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="student@ldce.ac.in"
                    className="pl-10"
                    error={errors.email?.message}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#1D1D1F]">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#0071E3] hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    error={errors.password?.message}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-medium mt-2 h-11 text-xs sm:text-sm"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-black/[0.06]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-3 text-[#86868B] font-medium">Or</span>
              </div>
            </div>

            {/* Google Authentication */}
            <GoogleSignInButton
              label="Continue with Google"
              onError={(err) => setErrorMessage(err)}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-[#86868B]">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-[#0071E3] hover:underline">
              Register here
            </Link>
          </p>
          <p className="text-[11px] text-[#A1A1A6]">
            Central TPO Admin login: Use verified admin credentials
          </p>
        </div>
      </div>
    </div>
  );
}
