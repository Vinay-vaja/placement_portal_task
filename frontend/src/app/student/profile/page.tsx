"use client";

import React, { useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import { StudentProfile, SemesterSpi } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ENGINEERING_BRANCHES } from "@/config/constants";
import {
  User,
  GraduationCap,
  FileCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Calendar,
  Phone,
  Building,
  Award,
} from "lucide-react";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [spis, setSpis] = useState<SemesterSpi[]>([]);
  const [cpi, setCpi] = useState<number>(0);
  const [cgpa, setCgpa] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states with NO hardcoded pre-filled values
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    dob: "",
    branch: "CE",
    studentType: "REGULAR" as "REGULAR" | "D2D",
    // 10th Standard marks (out of 100)
    mathsMarks: "",
    scienceMarks: "",
    englishMarks: "",
    socialScienceMarks: "",
    sanskritMarks: "",
    gujaratiMarks: "",
    // 12th Standard marks (for REGULAR students)
    twelfthEnglishMarks: "",
    twelfthPhysicsMarks: "",
    twelfthMathsMarks: "",
    twelfthChemistryMarks: "",
    twelfthComputerMarks: "",
    // D2D fields (for D2D students)
    d2dCgpa: "",
    d2dCollege: "",
    d2dDetails: "",
    d2dAcpcRank: "",
    declarationAccepted: false,
  });

  // SPI Form state (Semesters 1-6) - empty initially
  const [semesterSpis, setSemesterSpis] = useState<Record<number, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
  });

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getProfile();
      if (res.data) {
        const d = res.data as any;
        setProfile(d);
        setFormData({
          fullName: d.fullName || "",
          phone: d.phone || "",
          dob: d.dob ? d.dob.split("T")[0] : "",
          branch: d.branch || "CE",
          studentType: d.studentType || "REGULAR",
          mathsMarks: d.mathsMarks !== undefined && d.mathsMarks !== null ? String(d.mathsMarks) : "",
          scienceMarks: d.scienceMarks !== undefined && d.scienceMarks !== null ? String(d.scienceMarks) : "",
          englishMarks: d.englishMarks !== undefined && d.englishMarks !== null ? String(d.englishMarks) : "",
          socialScienceMarks: d.socialScienceMarks !== undefined && d.socialScienceMarks !== null ? String(d.socialScienceMarks) : "",
          sanskritMarks: d.sanskritMarks !== undefined && d.sanskritMarks !== null ? String(d.sanskritMarks) : "",
          gujaratiMarks: d.gujaratiMarks !== undefined && d.gujaratiMarks !== null ? String(d.gujaratiMarks) : "",
          twelfthEnglishMarks: d.twelfthEnglishMarks !== undefined && d.twelfthEnglishMarks !== null ? String(d.twelfthEnglishMarks) : "",
          twelfthPhysicsMarks: d.twelfthPhysicsMarks !== undefined && d.twelfthPhysicsMarks !== null ? String(d.twelfthPhysicsMarks) : "",
          twelfthMathsMarks: d.twelfthMathsMarks !== undefined && d.twelfthMathsMarks !== null ? String(d.twelfthMathsMarks) : "",
          twelfthChemistryMarks: d.twelfthChemistryMarks !== undefined && d.twelfthChemistryMarks !== null ? String(d.twelfthChemistryMarks) : "",
          twelfthComputerMarks: d.twelfthComputerMarks !== undefined && d.twelfthComputerMarks !== null ? String(d.twelfthComputerMarks) : "",
          d2dCgpa: d.d2dCgpa !== undefined && d.d2dCgpa !== null ? String(d.d2dCgpa) : "",
          d2dCollege: d.d2dCollege || "",
          d2dDetails: d.d2dDetails || "",
          d2dAcpcRank: d.d2dAcpcRank !== undefined && d.d2dAcpcRank !== null ? String(d.d2dAcpcRank) : "",
          declarationAccepted: d.declarationAccepted ?? Boolean(d.profileLocked),
        });
      }

      const spiRes = await studentService.getSpis();
      if (spiRes.data) {
        setSpis(spiRes.data.spis || []);
        setCpi(spiRes.data.cpi || 0);
        setCgpa(spiRes.data.cgpa || 0);
        if (spiRes.data.spis && spiRes.data.spis.length > 0) {
          const map: Record<number, string> = { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" };
          spiRes.data.spis.forEach((s) => {
            map[s.semester] = String(s.spi);
          });
          setSemesterSpis(map);
        }
      }
    } catch (err: unknown) {
      // Profile may not be created yet, which is expected for fresh accounts
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSpiChange = (sem: number, val: string) => {
    setSemesterSpis((prev) => ({
      ...prev,
      [sem]: val,
    }));
  };

  const calculateClientCpi = () => {
    const vals = Object.values(semesterSpis)
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v) && v > 0);
    if (vals.length === 0) return cpi ? cpi.toFixed(2) : "0.00";
    const sum = vals.reduce((acc, curr) => acc + curr, 0);
    return (sum / vals.length).toFixed(2);
  };

  const calculateTenthTotal = () => {
    const subjects = [
      formData.mathsMarks,
      formData.scienceMarks,
      formData.englishMarks,
      formData.socialScienceMarks,
      formData.sanskritMarks,
      formData.gujaratiMarks,
    ];
    let total = 0;
    let filled = 0;
    for (const s of subjects) {
      const val = parseFloat(s);
      if (!isNaN(val)) {
        total += val;
        filled++;
      }
    }
    return {
      total,
      percentage: filled > 0 ? ((total / 600) * 100).toFixed(2) : "0.00",
      filledCount: filled,
    };
  };

  const calculateTwelfthTotal = () => {
    if (formData.studentType !== "REGULAR") {
      return {
        total: 0,
        percentage: "0.00",
        filledCount: 0,
      };
    }
    const subjects = [
      formData.twelfthEnglishMarks,
      formData.twelfthPhysicsMarks,
      formData.twelfthMathsMarks,
      formData.twelfthChemistryMarks,
      formData.twelfthComputerMarks,
    ];
    let total = 0;
    let filled = 0;
    for (const s of subjects) {
      const val = parseFloat(s);
      if (!isNaN(val)) {
        total += val;
        filled++;
      }
    }
    return {
      total,
      percentage: filled > 0 ? ((total / (filled * 100)) * 100).toFixed(2) : "0.00",
      filledCount: filled,
    };
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Validate DOB (16 - 40 years)
      if (!formData.dob) {
        throw new Error("Date of birth is required.");
      }
      const dobDate = new Date(formData.dob);
      if (isNaN(dobDate.getTime())) {
        throw new Error("Please enter a valid date of birth.");
      }
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 16 || age > 40) {
        throw new Error("Student must be between 16 and 40 years old.");
      }

      // Validate Phone
      if (!formData.phone || formData.phone.trim().length < 10) {
        throw new Error("Phone number must be at least 10 digits.");
      }

      // Validate 10th marks
      const tenthKeys = [
        "mathsMarks",
        "scienceMarks",
        "englishMarks",
        "socialScienceMarks",
        "sanskritMarks",
        "gujaratiMarks",
      ] as const;

      for (const k of tenthKeys) {
        const val = parseFloat(formData[k]);
        if (isNaN(val) || val < 0 || val > 100) {
          throw new Error("All 6 10th standard subject marks (Maths, Science, English, Social Science, Sanskrit, Gujarati) must be between 0 and 100.");
        }
      }

      // Validate 12th marks if REGULAR
      if (formData.studentType === "REGULAR") {
        const twelfthKeys = [
          "twelfthEnglishMarks",
          "twelfthPhysicsMarks",
          "twelfthMathsMarks",
          "twelfthChemistryMarks",
          "twelfthComputerMarks",
        ] as const;
        for (const k of twelfthKeys) {
          const val = parseFloat(formData[k]);
          if (isNaN(val) || val < 0 || val > 100) {
            throw new Error("All 5 12th standard subject marks must be provided between 0 and 100 for Regular students.");
          }
        }
      } else {
        // Validate D2D
        const d2dVal = parseFloat(formData.d2dCgpa);
        if (isNaN(d2dVal) || d2dVal < 0 || d2dVal > 10) {
          throw new Error("Please enter a valid D2D Diploma CGPA between 0 and 10.");
        }
      }

      // 1. Submit SPIs
      for (const [sem, val] of Object.entries(semesterSpis)) {
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal > 0) {
          await studentService.addOrUpdateSpi({
            semester: Number(sem),
            spi: numVal,
          });
        }
      }

      // 2. Submit Profile (Flat schema matching backend profileSubmitSchema)
      const payload: any = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        dob: formData.dob,
        branch: formData.branch,
        studentType: formData.studentType,
        mathsMarks: parseFloat(formData.mathsMarks),
        scienceMarks: parseFloat(formData.scienceMarks),
        englishMarks: parseFloat(formData.englishMarks),
        socialScienceMarks: parseFloat(formData.socialScienceMarks),
        sanskritMarks: parseFloat(formData.sanskritMarks),
        gujaratiMarks: parseFloat(formData.gujaratiMarks),
        twelfthEnglishMarks:
          formData.studentType === "REGULAR" ? parseFloat(formData.twelfthEnglishMarks) : null,
        twelfthPhysicsMarks:
          formData.studentType === "REGULAR" ? parseFloat(formData.twelfthPhysicsMarks) : null,
        twelfthMathsMarks:
          formData.studentType === "REGULAR" ? parseFloat(formData.twelfthMathsMarks) : null,
        twelfthChemistryMarks:
          formData.studentType === "REGULAR" ? parseFloat(formData.twelfthChemistryMarks) : null,
        twelfthComputerMarks:
          formData.studentType === "REGULAR" ? parseFloat(formData.twelfthComputerMarks) : null,
        d2dCgpa:
          formData.studentType === "D2D" ? parseFloat(formData.d2dCgpa) : null,
        d2dCollege:
          formData.studentType === "D2D" ? (formData.d2dCollege.trim() || "Diploma College") : null,
        d2dDetails:
          formData.studentType === "D2D" ? (formData.d2dDetails.trim() || "Diploma in Engineering") : null,
        d2dAcpcRank:
          formData.studentType === "D2D" && formData.d2dAcpcRank
            ? parseInt(formData.d2dAcpcRank, 10)
            : null,
        declarationAccepted: true,
      };

      await studentService.submitProfile(payload);

      setSuccessMessage("Your academic profile has been submitted and locked for Central TPO verification!");
      await loadProfileData();
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to submit academic profile. Please verify all entries.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = Boolean(profile?.profileLocked);
  const tenthSummary = calculateTenthTotal();
  const twelfthSummary = calculateTwelfthTotal();

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Apple Minimal Hero Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Academic Profile
            </h1>
            {isLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20">
                <Lock className="h-3 w-3" /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
                Draft
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Enter your 10th standard marks (out of 600), 12th/D2D scores, and semester SPIs.
          </p>
        </div>

        {/* Calculated CPI, 10th & 12th / D2D Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-2xl bg-[#F5F5F7] p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[88px] border border-black/[0.04]">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868B] block">10th %</span>
            <span className="text-base sm:text-lg font-semibold text-[#1D1D1F]">
              {isLocked && profile?.tenthPercentage ? `${profile.tenthPercentage}%` : `${tenthSummary.percentage}%`}
            </span>
          </div>
          {formData.studentType === "REGULAR" ? (
            <div className="rounded-2xl bg-purple-50/70 p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[88px] border border-purple-200">
              <span className="text-[10px] font-medium uppercase tracking-wider text-purple-700 block">12th %</span>
              <span className="text-base sm:text-lg font-semibold text-purple-900">
                {isLocked && profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : `${twelfthSummary.percentage}%`}
              </span>
            </div>
          ) : (
            <div className="rounded-2xl bg-purple-50/70 p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[88px] border border-purple-200">
              <span className="text-[10px] font-medium uppercase tracking-wider text-purple-700 block">D2D CGPA</span>
              <span className="text-base sm:text-lg font-semibold text-purple-900">
                {formData.d2dCgpa || (profile?.d2dCgpa ? String(profile.d2dCgpa) : "—")}
              </span>
            </div>
          )}
          <div className="rounded-2xl bg-[#0071E3]/5 p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[88px] border border-[#0071E3]/15">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#0071E3] block">CPI</span>
            <span className="text-base sm:text-lg font-semibold text-[#0071E3]">{calculateClientCpi()}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-4 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#34C759]/10 p-4 text-xs font-medium text-[#28A745] border border-[#34C759]/20">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitProfile} className="space-y-6">
        {/* Section 1: Basic Student Info */}
        <Card className="rounded-3xl border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] bg-white">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <User className="h-4 w-4 text-[#0071E3]" /> Personal & Academic Details
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Your student identification, contact, and department
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Full Name</label>
              <Input
                required
                type="text"
                placeholder="Full Name as per official records"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLocked}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Phone Number</label>
              <Input
                required
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLocked}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Date of Birth</label>
              <Input
                required
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                disabled={isLocked}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Engineering Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                disabled={isLocked}
                className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs sm:text-sm text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
              >
                {ENGINEERING_BRANCHES.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-medium text-[#1D1D1F]">Admission Mode</label>
              <select
                value={formData.studentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    studentType: e.target.value as "REGULAR" | "D2D",
                  })
                }
                disabled={isLocked}
                className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs sm:text-sm text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
              >
                <option value="REGULAR">Regular (12th Admission)</option>
                <option value="D2D">D2D (Diploma to Degree)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: 10th Standard Marks Breakdown (Total: 600) */}
        <Card className="rounded-3xl border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] bg-white">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#0071E3]" /> 10th Standard Marks Breakdown
                </CardTitle>
                <CardDescription className="text-xs text-[#86868B]">
                  6 Subjects: Maths, Science, English, Social Science, Sanskrit, Gujarati (Total: 600)
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#1D1D1F]">
                  Total: {tenthSummary.total} / 600
                </span>
                <span className="block text-[11px] text-[#0071E3] font-medium">
                  {tenthSummary.percentage}%
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Mathematics</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                placeholder="Marks / 100"
                value={formData.mathsMarks}
                onChange={(e) => setFormData({ ...formData, mathsMarks: e.target.value })}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Science</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                placeholder="Marks / 100"
                value={formData.scienceMarks}
                onChange={(e) => setFormData({ ...formData, scienceMarks: e.target.value })}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">English</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                placeholder="Marks / 100"
                value={formData.englishMarks}
                onChange={(e) => setFormData({ ...formData, englishMarks: e.target.value })}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Social Science</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                placeholder="Marks / 100"
                value={formData.socialScienceMarks}
                onChange={(e) => setFormData({ ...formData, socialScienceMarks: e.target.value })}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Sanskrit</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                placeholder="Marks / 100"
                value={formData.sanskritMarks}
                onChange={(e) => setFormData({ ...formData, sanskritMarks: e.target.value })}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-[#1D1D1F]">Gujarati</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                placeholder="Marks / 100"
                value={formData.gujaratiMarks}
                onChange={(e) => setFormData({ ...formData, gujaratiMarks: e.target.value })}
                disabled={isLocked}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: 12th Marks OR D2D Details */}
        {formData.studentType === "REGULAR" ? (
          <Card className="rounded-3xl border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] bg-white">
            <CardHeader className="border-b border-black/[0.06] pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#0071E3]" /> 12th Standard Marks (Science Stream)
                  </CardTitle>
                  <CardDescription className="text-xs text-[#86868B]">
                    Required for Regular students. 5 Subjects: English, Physics, Maths, Chemistry, Computer (Total: 500)
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-[#1D1D1F]">
                    Total: {twelfthSummary.total} / 500
                  </span>
                  <span className="block text-[11px] text-purple-700 font-semibold">
                    {isLocked && profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : `${twelfthSummary.percentage}%`}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">English</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Marks / 100"
                  value={formData.twelfthEnglishMarks}
                  onChange={(e) => setFormData({ ...formData, twelfthEnglishMarks: e.target.value })}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Physics</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Marks / 100"
                  value={formData.twelfthPhysicsMarks}
                  onChange={(e) => setFormData({ ...formData, twelfthPhysicsMarks: e.target.value })}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Mathematics</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Marks / 100"
                  value={formData.twelfthMathsMarks}
                  onChange={(e) => setFormData({ ...formData, twelfthMathsMarks: e.target.value })}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Chemistry</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Marks / 100"
                  value={formData.twelfthChemistryMarks}
                  onChange={(e) => setFormData({ ...formData, twelfthChemistryMarks: e.target.value })}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Computer Science</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Marks / 100"
                  value={formData.twelfthComputerMarks}
                  onChange={(e) => setFormData({ ...formData, twelfthComputerMarks: e.target.value })}
                  disabled={isLocked}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] bg-white">
            <CardHeader className="border-b border-black/[0.06] pb-4">
              <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Building className="h-4 w-4 text-[#0071E3]" /> Diploma to Degree (D2D) Details
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B]">
                Diploma academic records and ACPC engineering admission ranking
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Diploma CGPA (0 - 10)</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.65"
                  value={formData.d2dCgpa}
                  onChange={(e) => setFormData({ ...formData, d2dCgpa: e.target.value })}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">ACPC Merit Rank</label>
                <Input
                  type="number"
                  placeholder="e.g. 142"
                  value={formData.d2dAcpcRank}
                  onChange={(e) => setFormData({ ...formData, d2dAcpcRank: e.target.value })}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Diploma College Name</label>
                <Input
                  type="text"
                  placeholder="Polytechnic / Institute Name"
                  value={formData.d2dCollege}
                  onChange={(e) => setFormData({ ...formData, d2dCollege: e.target.value })}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Diploma Specialization</label>
                <Input
                  type="text"
                  placeholder="e.g. Diploma in Computer Engineering"
                  value={formData.d2dDetails}
                  onChange={(e) => setFormData({ ...formData, d2dDetails: e.target.value })}
                  disabled={isLocked}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 4: Semester SPI Performance */}
        <Card className="rounded-3xl border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] bg-white">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0071E3]" /> Semester SPI Records (Sem 1 to 6)
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Input SPIs to compute aggregate CPI & CGPA for eligibility verification
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <div key={sem} className="space-y-1.5">
                <label className="font-medium text-[#1D1D1F]">Semester {sem} SPI</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="0.00"
                  value={semesterSpis[sem] || ""}
                  onChange={(e) => handleSpiChange(sem, e.target.value)}
                  disabled={isLocked}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit & Lock Profile */}
        {!isLocked && (
          <Card className="rounded-3xl border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] bg-white p-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded-md border-black/[0.15] text-[#0071E3] focus:ring-[#0071E3]"
              />
              <span className="text-xs text-[#1D1D1F]/80 leading-relaxed font-normal">
                I hereby declare that all academic marks (10th standard Gujarati & Sanskrit, 12th / D2D scores, and semester SPIs) submitted above are true and accurate. I understand that once submitted, this profile will be permanently locked and verified by the Central TPO.
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!formData.declarationAccepted}
              className="w-full font-medium py-3 text-sm gap-2 h-11"
            >
              <Lock className="h-4 w-4" /> Lock & Submit Profile for Verification
            </Button>
          </Card>
        )}
      </form>
    </div>
  );
}
