"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { CollegeLogo } from "@/components/shared/college-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Lock, Mail, User, Phone, Calendar, AlertCircle, GraduationCap, CheckCircle2 } from "lucide-react";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid college email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    dob: z.string().min(1, "Date of birth is required"),
    studentType: z.enum(["REGULAR", "D2D"]),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studentType: "REGULAR",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerAuth({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        dob: values.dob,
        studentType: values.studentType,
        password: values.password,
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Registration failed. Please verify your details.");
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
          src="/campus-2.png"
          alt="L.D. College of Engineering Heritage & Garden"
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
                Placement Portal Registration
              </span>
            </div>
          </div>
          <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-white/90 border border-white/20">
            Autonomous Institution
          </span>
        </div>

        {/* Empty bottom area so the image remains completely clear and visible */}
        <div />
      </div>

      {/* RIGHT SIDE: Fixed Non-Scrollable Register Card */}
      <div className="relative flex w-full lg:w-1/2 xl:w-5/12 h-full flex-col justify-center items-center px-4 sm:px-8 py-4 overflow-y-auto lg:overflow-hidden">
        {/* Floating Top Right Theme Toggle */}
        <div className="absolute top-3 right-4 sm:top-5 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-3.5 my-auto">
          {/* Header */}
          <div className="text-center space-y-1 flex flex-col items-center">
            <CollegeLogo size={52} showText={false} />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Student Registration
            </h1>
            <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
              Create your placement profile to access campus recruitment drives
            </p>
          </div>

          {/* Minimal Solid Card */}
          <Card className="border border-black/[0.08] dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-white dark:bg-[#0D0D11] rounded-3xl p-3 sm:p-4">
            <CardContent className="space-y-3 pt-1">
              {errorMessage && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-red-50/90 dark:bg-red-950/40 p-2.5 text-xs font-medium text-[#FF3B30] dark:text-red-400 border border-[#FF3B30]/20 dark:border-red-900/40">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B] dark:text-[#A1A1A6]" />
                    <Input
                      {...register("fullName")}
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="pl-9 h-9 text-xs"
                      error={errors.fullName?.message}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">College Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B] dark:text-[#A1A1A6]" />
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="student@ldce.ac.in"
                        className="pl-9 h-9 text-xs"
                        error={errors.email?.message}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B] dark:text-[#A1A1A6]" />
                      <Input
                        {...register("phone")}
                        type="tel"
                        placeholder="9876543210"
                        className="pl-9 h-9 text-xs"
                        error={errors.phone?.message}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B] dark:text-[#A1A1A6]" />
                      <Input
                        {...register("dob")}
                        type="date"
                        className="pl-9 h-9 text-xs"
                        error={errors.dob?.message}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Admission Mode</label>
                    <select
                      {...register("studentType")}
                      className="w-full h-9 rounded-xl border border-black/[0.1] dark:border-white/12 bg-[#F5F5F7]/80 dark:bg-[#16161C] px-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:bg-white dark:focus:bg-[#1C1C22] focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                    >
                      <option value="REGULAR">Regular (12th Admission)</option>
                      <option value="D2D">D2D (Diploma to Degree)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B] dark:text-[#A1A1A6]" />
                      <Input
                        {...register("password")}
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-9 text-xs"
                        error={errors.password?.message}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B] dark:text-[#A1A1A6]" />
                      <Input
                        {...register("confirmPassword")}
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-9 text-xs"
                        error={errors.confirmPassword?.message}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-semibold mt-1 h-9 text-xs bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3]"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </form>

              <div className="relative my-1.5">
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
                label="Sign Up with Google"
                onError={(err) => setErrorMessage(err)}
              />
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-[#86868B] dark:text-[#A1A1A6]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0071E3] dark:text-[#64D2FF] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
