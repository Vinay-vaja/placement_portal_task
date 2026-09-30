"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CollegeLogo } from "@/components/shared/college-logo";
import { Mail, KeyRound, AlertCircle, ArrowLeft, CheckCircle2, RotateCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1 = Request OTP, Step 2 = Enter & Verify OTP
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessNotice(res.message || "A 6-digit verification code has been dispatched to your email.");
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      // Focus first OTP field after transition
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err?.message || "Unable to send verification code. Please check your email and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessNotice(res.message || "A fresh 6-digit code has been sent.");
      setCountdown(60);
      setCanResend(false);
      setOtpValues(["", "", "", "", "", ""]);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single character in OTP digit box
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // If a digit was entered, auto-focus next input
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 6-digit OTP
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtpValues(newOtp);

    const nextEmptyIndex = newOtp.findIndex((v) => !v);
    if (nextEmptyIndex !== -1) {
      otpInputsRef.current[nextEmptyIndex]?.focus();
    } else {
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP and redirect to new password creation page
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpValues.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.verifyOtp(email.trim(), fullOtp);
      const resetToken = res.data?.resetToken;

      if (!resetToken) {
        throw new Error("Missing reset authorization token. Please try again.");
      }

      setSuccessNotice("Code verified! Redirecting to set your new password...");

      // Store in sessionStorage as fallback
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pw_reset_email", email.trim());
        sessionStorage.setItem("pw_reset_token", resetToken);
      }

      // Redirect to the new password page as required
      setTimeout(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(email.trim())}&token=${encodeURIComponent(resetToken)}`
        );
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-4 py-12 selection:bg-[#0071E3]/20">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Mark */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <CollegeLogo size={64} showText={false} />
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Placement Portal
          </h1>
          <p className="text-xs text-[#86868B] font-normal">
            L.D. College of Engineering • Ahmedabad
          </p>
        </div>

        {/* Minimal Card */}
        <Card className="border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] bg-white rounded-3xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-xl font-semibold text-[#1D1D1F]">
              {step === 1 ? "Forgot Password" : "Enter Verification Code"}
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              {step === 1
                ? "Enter your registered college email and we'll send a 6-digit OTP"
                : `We sent a security code to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-red-50/80 p-3 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50/80 p-3 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {step === 1 ? (
              /* Step 1: Email Form */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#1D1D1F]">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                    <Input
                      type="email"
                      required
                      placeholder="student@ldce.ac.in"
                      className="pl-10 text-xs sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-medium h-11 text-xs sm:text-sm"
                  isLoading={isLoading}
                >
                  Send Verification OTP
                </Button>
              </form>
            ) : (
              /* Step 2: OTP Verification Form */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#1D1D1F] block text-center">
                    6-Digit Security Code
                  </label>
                  <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border border-black/[0.12] bg-[#F5F5F7] focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all text-[#1D1D1F]"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-medium h-11 text-xs sm:text-sm shadow-sm"
                  isLoading={isLoading}
                  disabled={otpValues.join("").length !== 6}
                >
                  <KeyRound className="h-4 w-4 mr-2" /> Verify OTP & Continue
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className="text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isLoading}
                    className={`flex items-center gap-1 font-medium transition-colors ${
                      canResend
                        ? "text-[#0071E3] hover:underline"
                        : "text-[#86868B] cursor-not-allowed opacity-70"
                    }`}
                  >
                    <RotateCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 text-center border-t border-black/[0.06]">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
