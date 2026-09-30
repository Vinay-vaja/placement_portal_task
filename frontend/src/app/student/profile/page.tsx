"use client";

import React, { useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import { StudentProfile, SemesterSpi } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  FileCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  TrendingUp,
  Save,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  Award,
} from "lucide-react";

const BRANCHES = [
  "CE", "AIML", "IT", "EC", "EE", "CIVIL",
  "CHEMICAL", "MECHANICAL", "RUBBER", "PLASTIC",
  "ENVIRONMENTAL", "IC",
];

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [spis, setSpis] = useState<SemesterSpi[]>([]);
  const [cpi, setCpi] = useState<number>(0);
  const [cgpa, setCgpa] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    dob: "",
    branch: "CE",
    studentType: "REGULAR" as "REGULAR" | "D2D",
    mathsMarks: 85,
    scienceMarks: 82,
    englishMarks: 88,
    socialScienceMarks: 80,
    computerPtMarks: 90,
    sanskritMarks: 85,
    twelfthEnglishMarks: 85,
    twelfthPhysicsMarks: 82,
    twelfthMathsMarks: 88,
    twelfthChemistryMarks: 80,
    twelfthComputerMarks: 90,
    d2dCgpa: 8.5,
    d2dCollege: "",
    d2dDetails: "",
    d2dAcpcRank: 120,
    declarationAccepted: true,
  });

  // SPI Form state (Semesters 1-6)
  const [semesterSpis, setSemesterSpis] = useState<Record<number, number>>({
    1: 8.2,
    2: 8.4,
    3: 8.6,
    4: 8.5,
    5: 8.8,
  });

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getProfile();
      if (res.data) {
        setProfile(res.data);
        setFormData((prev) => ({
          ...prev,
          fullName: res.data.fullName || "",
          phone: res.data.phone || "",
          branch: res.data.branch || "CE",
          studentType: res.data.studentType || "REGULAR",
        }));
      }

      const spiRes = await studentService.getSpis();
      if (spiRes.data) {
        setSpis(spiRes.data.spis || []);
        setCpi(spiRes.data.cpi || 0);
        setCgpa(spiRes.data.cgpa || 0);
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

  const handleSpiChange = (sem: number, val: number) => {
    setSemesterSpis((prev) => ({
      ...prev,
      [sem]: val,
    }));
  };

  const calculateClientCpi = () => {
    const vals = Object.values(semesterSpis).filter((v) => v > 0);
    if (vals.length === 0) return "0.00";
    const sum = vals.reduce((acc, curr) => acc + curr, 0);
    return (sum / vals.length).toFixed(2);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // 1. Submit SPIs
      for (const [sem, val] of Object.entries(semesterSpis)) {
        if (val > 0) {
          await studentService.addOrUpdateSpi({
            semester: Number(sem),
            spi: Number(val),
          });
        }
      }

      // 2. Complete Profile
      await studentService.completeProfile({
        phone: formData.phone,
        dob: formData.dob || "2002-05-15",
        branch: formData.branch as any,
        studentType: formData.studentType,
        tenthMarks: {
          maths: Number(formData.mathsMarks),
          science: Number(formData.scienceMarks),
          english: Number(formData.englishMarks),
          socialScience: Number(formData.socialScienceMarks),
          computerPt: Number(formData.computerPtMarks),
          sanskrit: Number(formData.sanskritMarks),
        },
        twelfthMarks: formData.studentType === "REGULAR" ? {
          english: Number(formData.twelfthEnglishMarks),
          physics: Number(formData.twelfthPhysicsMarks),
          maths: Number(formData.twelfthMathsMarks),
          chemistry: Number(formData.twelfthChemistryMarks),
          computer: Number(formData.twelfthComputerMarks),
        } : undefined,
        d2dDetails: formData.studentType === "D2D" ? {
          cgpa: Number(formData.d2dCgpa),
          collegeName: formData.d2dCollege || "Diploma College",
          details: formData.d2dDetails || "Diploma in Engineering",
          acpcRank: Number(formData.d2dAcpcRank),
        } : undefined,
        declarationAccepted: true,
      } as any);

      setSuccessMessage("Your academic profile has been submitted and locked for Central TPO verification!");
      loadProfileData();
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to submit academic profile. Please check all required marks.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-6 md:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Academic & Personal Profile
            </h1>
            {profile?.profileLocked && (
              <Badge className="bg-emerald-500 text-white font-bold gap-1 border-0">
                <Lock className="h-3 w-3" /> Profile Locked
              </Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-blue-100 font-medium">
            Enter your 10th marks, 12th/D2D scores, and semester SPIs for CPI verification.
          </p>
        </div>

        {/* Calculated CPI Card */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 font-bold">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Computed CPI</span>
            <span className="text-2xl font-black text-white">{calculateClientCpi()} / 10.0</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitProfile} className="space-y-6">
        {/* Section 1: Basic Student Info */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Full Name</label>
              <Input
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={profile?.profileLocked}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Phone Number</label>
              <Input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={profile?.profileLocked}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Engineering Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                disabled={profile?.profileLocked}
                className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b} Branch
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Admission Category</label>
              <select
                value={formData.studentType}
                onChange={(e) => setFormData({ ...formData, studentType: e.target.value as "REGULAR" | "D2D" })}
                disabled={profile?.profileLocked}
                className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="REGULAR">Regular (12th Admission)</option>
                <option value="D2D">D2D (Diploma to Degree)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: 10th Class Marks Breakdown */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" /> 10th Standard Marks (Out of 100)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Required for percentage computation and TPO verification
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Mathematics</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={formData.mathsMarks}
                onChange={(e) => setFormData({ ...formData, mathsMarks: Number(e.target.value) })}
                disabled={profile?.profileLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Science</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={formData.scienceMarks}
                onChange={(e) => setFormData({ ...formData, scienceMarks: Number(e.target.value) })}
                disabled={profile?.profileLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">English</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={formData.englishMarks}
                onChange={(e) => setFormData({ ...formData, englishMarks: Number(e.target.value) })}
                disabled={profile?.profileLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Social Science</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={formData.socialScienceMarks}
                onChange={(e) => setFormData({ ...formData, socialScienceMarks: Number(e.target.value) })}
                disabled={profile?.profileLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Computer / PT</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={formData.computerPtMarks}
                onChange={(e) => setFormData({ ...formData, computerPtMarks: Number(e.target.value) })}
                disabled={profile?.profileLocked}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Sanskrit</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={formData.sanskritMarks}
                onChange={(e) => setFormData({ ...formData, sanskritMarks: Number(e.target.value) })}
                disabled={profile?.profileLocked}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Semester SPI Tracker */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Semester SPI Performance
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Input Semester SPIs (1 to 6) to compute aggregate CPI & CGPA
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <div key={sem} className="space-y-1.5">
                <label className="font-semibold text-slate-700">Semester {sem} SPI</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="0.00"
                  value={semesterSpis[sem] || ""}
                  onChange={(e) => handleSpiChange(sem, Number(e.target.value))}
                  disabled={profile?.profileLocked}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit & Declaration */}
        {!profile?.profileLocked && (
          <Card className="border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 font-medium leading-relaxed">
                I hereby declare that all academic marks and details provided above are true and accurate. Any discrepancy discovered during verification will lead to immediate cancellation of my placement registration.
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!formData.declarationAccepted}
              className="w-full font-semibold shadow-xl shadow-blue-500/20 py-3 text-sm gap-2"
            >
              <Lock className="h-4 w-4" /> Lock & Submit Profile to TPO
            </Button>
          </Card>
        )}
      </form>
    </div>
  );
}
