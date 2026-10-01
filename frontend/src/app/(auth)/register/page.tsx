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
import { Lock, Mail, User, Phone, Calendar, AlertCircle } from "lucide-react";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-4 py-12 selection:bg-[#0071E3]/20">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <CollegeLogo size={64} showText={false} />
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Student Registration
          </h1>
          <p className="text-xs text-[#86868B]">
            Create your account to submit academic credentials for recruitment drives
          </p>
        </div>

        {/* Minimal Card */}
        <Card className="border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] bg-white rounded-3xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-xl font-semibold text-[#1D1D1F]">New Account</CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Enter your details to create your placement student profile
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
                <label className="text-xs font-medium text-[#1D1D1F]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                  <Input
                    {...register("fullName")}
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="pl-10"
                    error={errors.fullName?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">College Email</label>
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
                  <label className="text-xs font-medium text-[#1D1D1F]">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                    <Input
                      {...register("phone")}
                      type="tel"
                      placeholder="9876543210"
                      className="pl-10"
                      error={errors.phone?.message}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                    <Input
                      {...register("dob")}
                      type="date"
                      className="pl-10"
                      error={errors.dob?.message}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">Admission Mode</label>
                  <select
                    {...register("studentType")}
                    className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs sm:text-sm text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                  >
                    <option value="REGULAR">Regular (12th Admission)</option>
                    <option value="D2D">D2D (Diploma to Degree)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">Password</label>
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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                    <Input
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      error={errors.confirmPassword?.message}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-medium mt-2 h-11 text-xs sm:text-sm"
                isLoading={isLoading}
              >
                Create Account
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
              label="Sign Up with Google"
              onError={(err) => setErrorMessage(err)}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-[#86868B]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#0071E3] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
