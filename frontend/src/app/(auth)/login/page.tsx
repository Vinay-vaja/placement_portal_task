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
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Lock, Mail, AlertCircle, Award, Building2, TrendingUp } from "lucide-react";

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
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F5F7] dark:bg-black selection:bg-[#0071E3]/20">
      {/* LEFT SIDE: Clean, Unobstructed Campus Visual Showcase (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 h-full flex-col justify-between p-6 xl:p-8 overflow-hidden select-none">
        {/* Full HD Clear Campus Background Image */}
        <img
          src="/campus-1.png"
          alt="L.D. College of Engineering Campus"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Minimal Subtle Glass Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-md">
            <CollegeLogo size={34} showText={false} />
            <div className="leading-tight">
              <span className="text-xs font-bold tracking-tight text-white block">
                L.D. College of Engineering
              </span>
              <span className="text-[10px] text-white/80 font-normal block">
                Training & Placement Cell
              </span>
            </div>
          </div>
          <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-white/90 border border-white/20">
            Est. 1948 • Ahmedabad
          </span>
        </div>

        {/* Empty bottom area so the image remains completely clear and visible */}
        <div />
      </div>

      {/* RIGHT SIDE: Fixed Non-Scrollable Login Card */}
      <div className="relative flex w-full lg:w-1/2 xl:w-5/12 h-full flex-col justify-center items-center px-4 sm:px-8 py-6 overflow-hidden">
        {/* Floating Top Right Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-4 my-auto">
          {/* Mobile Logo & Brand Header */}
          <div className="text-center space-y-1.5 flex flex-col items-center lg:pb-1">
            <CollegeLogo size={sizeForLogo()} showText={false} />
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Sign In
            </h1>
            <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
              L.D. College of Engineering • Ahmedabad
            </p>
          </div>

          {/* Minimal Solid Login Card */}
          <Card className="border border-black/[0.08] dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-white dark:bg-[#0D0D11] rounded-3xl p-2 sm:p-3">
            <CardContent className="space-y-3.5 pt-2">
              {errorMessage && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-red-50/90 dark:bg-red-950/40 p-3 text-xs font-medium text-[#FF3B30] dark:text-red-400 border border-[#FF3B30]/20 dark:border-red-900/40">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B] dark:text-[#A1A1A6]" />
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="student@ldce.ac.in"
                      className="pl-10 h-10"
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-[#0071E3] dark:text-[#64D2FF] hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B] dark:text-[#A1A1A6]" />
                    <Input
                      {...register("password")}
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-10"
                      error={errors.password?.message}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-semibold mt-1 h-10 text-xs sm:text-sm bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3]"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-black/[0.06] dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-white dark:bg-[#0D0D11] px-3 text-[#86868B] dark:text-[#A1A1A6] font-medium">
                    Or
                  </span>
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
          <div className="text-center space-y-1 pt-1">
            <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#0071E3] dark:text-[#64D2FF] hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-[11px] text-[#A1A1A6] dark:text-[#6E6E73]">
              Central TPO Admin login: Use verified college credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function sizeForLogo() {
  return 58;
}
