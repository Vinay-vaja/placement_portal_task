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
import { GraduationCap, Lock, Mail, User, Phone, Calendar, AlertCircle } from "lucide-react";

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
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        studentType: values.studentType,
        password: values.password,
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Student Account Registration
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Register to set up your academic profile and apply for campus drives
          </p>
        </div>

        {/* Register Card */}
        <Card className="border border-slate-200 shadow-xl bg-white rounded-2xl">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-xl font-bold text-slate-900">Create Account</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your details to register as an LDCE student
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    {...register("fullName")}
                    type="text"
                    placeholder="Patel Axay Rameshchandra"
                    className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                    error={errors.fullName?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">College Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="student@ldce.ac.in"
                      className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("phone")}
                      type="tel"
                      placeholder="9876543210"
                      className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                      error={errors.phone?.message}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("dob")}
                      type="date"
                      className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                      error={errors.dob?.message}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Student Category</label>
                  <select
                    {...register("studentType")}
                    className="w-full h-10 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="REGULAR">Regular (12th Admission)</option>
                    <option value="D2D">D2D (Diploma to Degree)</option>
                  </select>
                  {errors.studentType && (
                    <p className="text-xs text-red-500 mt-1">{errors.studentType.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("password")}
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                      error={errors.password?.message}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                      error={errors.confirmPassword?.message}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-semibold shadow-lg shadow-blue-600/20 mt-2 py-2.5"
                isLoading={isLoading}
              >
                Register Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}

