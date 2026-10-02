"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { driveService } from "@/services/drive.service";
import { studentService } from "@/services/student.service";
import { RecruitmentDrive, StudentProfile, Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Send,
  Upload,
  FileText,
  X,
  Lock,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  Search,
  Award,
  Check,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

function CompanyLogo({ src, name }: { src?: string | null; name: string }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src || imageError) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3] shrink-0">
        <Building2 className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="logo-badge h-12 w-12 rounded-2xl p-1 shrink-0 flex items-center justify-center bg-white shadow-xs border border-black/[0.06] dark:border-white/20">
      <img
        src={src}
        alt={name}
        className="h-full w-full object-contain rounded-xl"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

function DriveDetailsModal({
  drive,
  onClose,
  onApply,
  isVerified,
}: {
  drive: RecruitmentDrive;
  onClose: () => void;
  onApply: (driveId: string) => void;
  isVerified: boolean;
}) {
  const companyTitle = drive.company?.name || (drive as any).companyName || "Recruiting Company";
  const jobTitle = drive.role || (drive as any).jobRole || "Engineering Role";
  const companyLogo = drive.company?.imageUrl || (drive as any).companyLogo;

  const ctcDisplay = drive.ctcMax
    ? `₹${drive.ctc} - ${drive.ctcMax} LPA`
    : drive.ctc
    ? `₹${drive.ctc} LPA`
    : (drive as any).ctcPackage || "Competitive";

  const deadlineDisplay = drive.applicationDeadline
    ? new Date(drive.applicationDeadline).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : drive.deadline
    ? new Date(drive.deadline).toLocaleDateString()
    : "Open";

  const branchesList = drive.allowedBranches || (drive as any).eligibleBranches || [];

  const brochureMatch = (drive.description || "").match(/Brochure:\s*(https?:\/\/[^\s]+)/i);
  const brochureUrl = (drive as any).brochureUrl || (brochureMatch ? brochureMatch[1] : null);

  const cleanDescription = (drive.description || "")
    .replace(/📄 Company Brochure & Documents:\s*https?:\/\/[^\s]+/gi, "")
    .trim();

  let rounds: any[] = [];
  if (drive.roundDetails) {
    if (Array.isArray(drive.roundDetails)) {
      rounds = drive.roundDetails;
    } else if (typeof drive.roundDetails === "object" && Array.isArray((drive.roundDetails as any).rounds)) {
      rounds = (drive.roundDetails as any).rounds;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/[0.06] pb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <CompanyLogo src={companyLogo} name={companyTitle} />
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F] truncate">
                {companyTitle}
              </h2>
              <p className="text-sm font-semibold text-[#0071E3] truncate">{jobTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-[#86868B]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 text-xs pr-1">
          {/* Key Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F5F7]/80 p-4 rounded-2xl border border-black/[0.04]">
            <div>
              <span className="text-[10px] font-medium text-[#86868B] block uppercase tracking-wider">Package (CTC)</span>
              <span className="text-sm font-bold text-[#1D1D1F] mt-0.5 block">{ctcDisplay}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-[#86868B] block uppercase tracking-wider">Min CPI Cutoff</span>
              <span className="text-sm font-bold text-[#0071E3] mt-0.5 block">
                {drive.minCpi ? `${drive.minCpi} CPI` : "No Cutoff"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-[#86868B] block uppercase tracking-wider">Job Location</span>
              <span className="text-xs font-semibold text-[#1D1D1F] mt-0.5 truncate block">{drive.location || "On-site"}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-[#86868B] block uppercase tracking-wider">Deadline</span>
              <span className="text-xs font-semibold text-[#1D1D1F] mt-0.5 block">{deadlineDisplay}</span>
            </div>
          </div>

          {/* Job Description */}
          {cleanDescription && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#0071E3]" /> Job Description & Overview
              </h3>
              <div className="p-4 rounded-2xl bg-[#F5F5F7]/50 border border-black/[0.04] text-[#3A3A3C] text-xs leading-relaxed whitespace-pre-line">
                {cleanDescription}
              </div>
            </div>
          )}

          {/* Brochure Link */}
          {brochureUrl && (
            <div className="p-3.5 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0071E3]">
                <FileText className="h-4 w-4" /> Company Recruitment Brochure & Documentation
              </div>
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0071E3] text-white text-xs font-medium hover:bg-[#0077ED] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Brochure
              </a>
            </div>
          )}

          {/* Comprehensive Eligibility Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#0071E3]" /> Eligibility Criteria & Cutoffs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F5F5F7]/50 border border-black/[0.04]">
              <div>
                <span className="text-[11px] text-[#86868B] block">Allowed Candidate Type</span>
                <span className="font-semibold text-[#1D1D1F] text-xs">
                  {drive.allowedStudentType === "ALL" || !drive.allowedStudentType
                    ? "All (Regular 12th + D2D Diploma)"
                    : drive.allowedStudentType === "REGULAR"
                    ? "Regular 12th Only"
                    : "D2D Diploma Only"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#86868B] block">Backlog Policy</span>
                <span className="font-semibold text-[#1D1D1F] text-xs">
                  {drive.backlogsAllowed ? "Allowed (Active Backlogs Permitted)" : "No Backlogs Allowed"}
                </span>
              </div>
              {drive.minTenthPercentage !== undefined && drive.minTenthPercentage !== null && (
                <div>
                  <span className="text-[11px] text-[#86868B] block">Min 10th Standard %</span>
                  <span className="font-semibold text-[#1D1D1F] text-xs">{drive.minTenthPercentage}%</span>
                </div>
              )}
              {drive.minTwelfthPercentage !== undefined && drive.minTwelfthPercentage !== null && (
                <div>
                  <span className="text-[11px] text-[#86868B] block">Min 12th Standard %</span>
                  <span className="font-semibold text-[#1D1D1F] text-xs">{drive.minTwelfthPercentage}%</span>
                </div>
              )}
              {drive.minCgpa !== undefined && drive.minCgpa !== null && (
                <div>
                  <span className="text-[11px] text-[#86868B] block">Min CGPA Cutoff</span>
                  <span className="font-semibold text-[#1D1D1F] text-xs">{drive.minCgpa} CGPA</span>
                </div>
              )}
            </div>

            {/* Eligible Branches */}
            <div className="pt-2">
              <span className="text-[11px] text-[#86868B] font-medium block mb-1.5">Allowed Engineering Branches:</span>
              <div className="flex flex-wrap gap-1.5">
                {branchesList.length === 0 ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    All Engineering Branches Allowed
                  </span>
                ) : (
                  branchesList.map((b: string) => (
                    <span
                      key={b}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1D1D1F] border border-black/[0.08] shadow-2xs"
                    >
                      {b}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recruitment Rounds */}
          {rounds.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#0071E3]" /> Selection & Interview Schedule
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F7] border-b border-black/[0.06] text-[#86868B] text-[11px] font-semibold">
                      <th className="py-2.5 px-3">Round Name</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Venue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] text-[#1D1D1F]">
                    {rounds.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F5F5F7]/50">
                        <td className="py-2.5 px-3 font-semibold">{r.name || `Round ${idx + 1}`}</td>
                        <td className="py-2.5 px-3 text-[#86868B]">{r.date || "TBA"}</td>
                        <td className="py-2.5 px-3 text-[#86868B]">{r.time || "TBA"}</td>
                        <td className="py-2.5 px-3 text-[#86868B]">{r.venue || "TBA"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Authoritative Eligibility Breakdown */}
          {drive.eligibility && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                drive.eligibility.eligible
                  ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
                  : "bg-rose-50/70 border-rose-200/80 text-rose-900"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {drive.eligibility.eligible ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    You meet all eligibility criteria for this recruitment drive
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    You are not eligible for this recruitment drive:
                  </>
                )}
              </div>
              {!drive.eligibility.eligible && drive.eligibility.reasons.length > 0 && (
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800">
                  {drive.eligibility.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Application Rules */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Application Rules:</span> Applications submitted for this recruitment drive are binding. Candidates must attend all interview rounds if shortlisted. Unexcused absence will trigger placement debarment under campus guidelines.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-black/[0.06]">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 text-xs h-10 rounded-xl"
          >
            Close Details
          </Button>

          {drive.eligibility && !drive.eligibility.eligible ? (
            <Button
              variant="outline"
              disabled
              className="flex-1 text-xs h-10 rounded-xl gap-2 border-rose-200 text-rose-700 bg-rose-50 cursor-not-allowed opacity-80"
            >
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Ineligible to Apply
            </Button>
          ) : isVerified ? (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onApply(drive.id);
              }}
              className="flex-1 text-xs h-10 rounded-xl gap-2 bg-[#0071E3] hover:bg-[#0077ED]"
            >
              <Send className="h-3.5 w-3.5" /> Apply for Placement
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onApply(drive.id);
              }}
              className="flex-1 text-xs h-10 rounded-xl gap-2 border-black/[0.1] text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              <Lock className="h-3.5 w-3.5 text-amber-600" /> Verification Required to Apply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "applied" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);

  // Modal states
  const [detailsModalDrive, setDetailsModalDrive] = useState<RecruitmentDrive | null>(null);
  const [applyModalDriveId, setApplyModalDriveId] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDrivesAndProfile = async () => {
    try {
      setIsLoading(true);
      const [drivesRes, profileRes, appsRes] = await Promise.allSettled([
        driveService.getDrives({ status: "ALL", includeApplied: "true" } as any),
        studentService.getProfile(),
        studentService.getApplications(),
      ]);

      if (drivesRes.status === "fulfilled" && drivesRes.value?.data?.data) {
        setDrives(drivesRes.value.data.data);
      } else {
        setDrives([]);
      }

      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        setStudentProfile(profileRes.value.data);
      }

      if (appsRes.status === "fulfilled") {
        const raw = appsRes.value?.data as any;
        if (Array.isArray(raw)) {
          setApplications(raw);
        } else if (raw?.data && Array.isArray(raw.data)) {
          setApplications(raw.data);
        } else {
          setApplications([]);
        }
      } else {
        setApplications([]);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load placement drives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivesAndProfile();
  }, []);

  const isVerified = studentProfile?.verificationStatus === "VERIFIED";

  // Applied drive IDs set
  const appliedDriveIds = new Set(applications.map((a) => a.driveId));

  // Upcoming / Open drives: active drives that student has NOT applied to yet
  const upcomingDrives = drives.filter(
    (d) => d.status !== "CLOSED" && !appliedDriveIds.has(d.id)
  );

  // Past / Closed drives: closed drives (or where deadline passed) that student hasn't applied to
  const pastDrives = drives.filter(
    (d) => d.status === "CLOSED" && !appliedDriveIds.has(d.id)
  );

  // Search filtering
  const query = searchQuery.trim().toLowerCase();

  const filteredUpcoming = upcomingDrives.filter((d) => {
    if (!query) return true;
    const name = (d.company?.name || (d as any).companyName || "").toLowerCase();
    const role = (d.role || (d as any).jobRole || "").toLowerCase();
    return name.includes(query) || role.includes(query);
  });

  const filteredApplied = applications.filter((app) => {
    if (!query) return true;
    const d = app.drive;
    const name = (d?.company?.name || (d as any)?.companyName || "").toLowerCase();
    const role = (d?.role || (d as any)?.jobRole || "").toLowerCase();
    return name.includes(query) || role.includes(query);
  });

  const filteredPast = pastDrives.filter((d) => {
    if (!query) return true;
    const name = (d.company?.name || (d as any).companyName || "").toLowerCase();
    const role = (d.role || (d as any).jobRole || "").toLowerCase();
    return name.includes(query) || role.includes(query);
  });

  const openApplyModal = (driveId: string) => {
    const targetDrive = drives.find((d) => d.id === driveId);
    if (targetDrive?.eligibility && !targetDrive.eligibility.eligible) {
      const reasonsList = targetDrive.eligibility.reasons.join(". ");
      setErrorMessage(`You are not eligible for this drive: ${reasonsList}`);
      toast.error("You do not meet the eligibility criteria for this drive.");
      return;
    }
    if (!studentProfile?.profileLocked) {
      setErrorMessage("Please complete and submit your academic profile before applying to drives.");
      toast.error("Please complete and submit your academic profile before applying.");
      return;
    }
    if (!isVerified) {
      setErrorMessage(
        `Your profile status is ${studentProfile?.verificationStatus || "PENDING"}. Central TPO verification is required before you can apply to drives.`
      );
      toast.error("Central TPO verification is required before you can apply.");
      return;
    }
    setApplyModalDriveId(driveId);
    setTermsAccepted(false);
    setResumeFile(null);
    setErrorMessage(null);
  };

  const closeApplyModal = () => {
    setApplyModalDriveId(null);
    setTermsAccepted(false);
    setResumeFile(null);
  };

  const handleApply = async (driveId: string) => {
    if (!termsAccepted) {
      setErrorMessage("You must accept the terms before applying.");
      toast.error("You must accept the terms before applying.");
      return;
    }
    if (!resumeFile) {
      setErrorMessage("Please upload your resume PDF before applying.");
      toast.error("Please upload your resume PDF before applying.");
      return;
    }
    try {
      setApplyingDriveId(driveId);
      setErrorMessage(null);
      setSuccessMessage(null);
      const formData = new FormData();
      formData.append("termsAccepted", "true");
      formData.append("resume", resumeFile);
      await driveService.applyToDrive(driveId, formData);
      toast.success("Application submitted successfully!");
      setSuccessMessage("Application submitted successfully!");
      closeApplyModal();
      fetchDrivesAndProfile();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to submit application. Make sure your profile is verified.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setApplyingDriveId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Campus Placement Drives
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Explore upcoming recruitment drives, track your applied drives, and review past drive history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Candidate
            </span>
          ) : studentProfile?.verificationStatus === "REJECTED" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
              <AlertCircle className="h-3.5 w-3.5" /> Verification Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5" /> Verification Pending
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
            {upcomingDrives.length} Open Drives
          </span>
        </div>
      </div>

      {/* 3 Interactive Stat Widgets: Upcoming Drives, Applied Drives, Past Drives */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Widget 1: Upcoming Drives */}
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${
            activeTab === "upcoming"
              ? "bg-[#0071E3]/5 border-[#0071E3] shadow-md ring-2 ring-[#0071E3]/20"
              : "bg-white border-black/[0.08] hover:border-black/[0.15] shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
              Upcoming Drives
            </span>
            <div
              className={`p-2.5 rounded-2xl ${
                activeTab === "upcoming" ? "bg-[#0071E3] text-white" : "bg-[#0071E3]/10 text-[#0071E3]"
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
              {upcomingDrives.length}
            </div>
            <p className="text-xs text-[#86868B] mt-1">
              Active campus drives available to apply
            </p>
          </div>
          {activeTab === "upcoming" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0071E3]" />
          )}
        </button>

        {/* Widget 2: Applied Drives */}
        <button
          type="button"
          onClick={() => setActiveTab("applied")}
          className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${
            activeTab === "applied"
              ? "bg-[#34C759]/5 border-[#34C759] shadow-md ring-2 ring-[#34C759]/20"
              : "bg-white border-black/[0.08] hover:border-black/[0.15] shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
              Applied Drives
            </span>
            <div
              className={`p-2.5 rounded-2xl ${
                activeTab === "applied" ? "bg-[#34C759] text-white" : "bg-[#34C759]/10 text-[#34C759]"
              }`}
            >
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
              {applications.length}
            </div>
            <p className="text-xs text-[#86868B] mt-1">
              Submitted applications & live stages
            </p>
          </div>
          {activeTab === "applied" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#34C759]" />
          )}
        </button>

        {/* Widget 3: Past Drives */}
        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${
            activeTab === "past"
              ? "bg-slate-100 border-slate-500 shadow-md ring-2 ring-slate-400/20"
              : "bg-white border-black/[0.08] hover:border-black/[0.15] shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
              Past Drives
            </span>
            <div
              className={`p-2.5 rounded-2xl ${
                activeTab === "past" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
              {pastDrives.length}
            </div>
            <p className="text-xs text-[#86868B] mt-1">
              Closed & completed placement drives
            </p>
          </div>
          {activeTab === "past" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600" />
          )}
        </button>
      </div>

      {/* Segmented Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none">
          <div className="inline-flex p-1 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "upcoming"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Upcoming ({upcomingDrives.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("applied")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "applied"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              Applied ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "past"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Past ({pastDrives.length})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-2xl border border-black/[0.08] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20"
          />
        </div>
      </div>

      {/* Verification Status Banner */}
      {isVerified ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#34C759]/10 p-4 text-xs font-medium text-[#28A745] border border-[#34C759]/20">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Profile Verified • You are approved by Central TPO and eligible to apply to qualified upcoming drives below.</span>
        </div>
      ) : studentProfile?.verificationStatus === "PENDING" ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-amber-50 p-4 text-xs font-medium text-amber-900 border border-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>Profile Verification Pending • Your academic record is under review by Central TPO. You can view all upcoming drives below; applications will unlock once verified.</span>
          </div>
          <Link href="/student/profile" className="font-semibold text-amber-900 underline hover:no-underline whitespace-nowrap">
            View Profile →
          </Link>
        </div>
      ) : studentProfile?.verificationStatus === "REJECTED" ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-red-50 p-4 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Profile Rejected: {studentProfile.dismissalReason || "Please verify your 10th/12th marks or contact Central TPO."}</span>
          </div>
          <Link href="/student/profile" className="font-semibold text-[#FF3B30] underline hover:no-underline whitespace-nowrap">
            Update Profile →
          </Link>
        </div>
      ) : !studentProfile?.profileLocked ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-blue-50 p-4 text-xs font-medium text-[#0071E3] border border-[#0071E3]/20">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Profile Incomplete • Complete and submit your 10th, 12th/D2D scores, and semester SPIs to qualify for placement drives.</span>
          </div>
          <Link href="/student/profile" className="font-semibold text-[#0071E3] underline hover:no-underline whitespace-nowrap">
            Complete Profile →
          </Link>
        </div>
      ) : null}

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

      {/* Loading state */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#86868B]">
          Loading placement drives & applications...
        </div>
      ) : null}

      {/* TAB 1: UPCOMING DRIVES */}
      {!isLoading && activeTab === "upcoming" && (
        filteredUpcoming.length === 0 ? (
          <Card className="rounded-3xl border border-black/[0.08] bg-white p-12 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <Building2 className="mx-auto h-10 w-10 text-[#A1A1A6]" />
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              {searchQuery ? "No matching upcoming drives" : "No Open Drives Currently"}
            </h3>
            <p className="text-xs text-[#86868B] max-w-sm mx-auto">
              {searchQuery
                ? "Try clearing your search query to see all open drives."
                : "Check back later as new companies are added by the Central TPO team."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredUpcoming.map((drive) => {
              const companyTitle = drive.company?.name || (drive as any).companyName || "Recruiting Company";
              const jobTitle = drive.role || (drive as any).jobRole || "Engineering Role";
              const ctcDisplay = drive.ctcMax
                ? `₹${drive.ctc} - ${drive.ctcMax} LPA`
                : drive.ctc
                ? `₹${drive.ctc} LPA`
                : (drive as any).ctcPackage || "Competitive";
              const deadlineDisplay = drive.applicationDeadline
                ? new Date(drive.applicationDeadline).toLocaleDateString()
                : drive.deadline
                ? new Date(drive.deadline).toLocaleDateString()
                : "Open";
              const branchesList = drive.allowedBranches || (drive as any).eligibleBranches || [];
              const companyLogo = drive.company?.imageUrl || (drive as any).companyLogo;
              const brochureMatch = (drive.description || "").match(/Brochure:\s*(https?:\/\/[^\s]+)/i);
              const brochureUrl = (drive as any).brochureUrl || (brochureMatch ? brochureMatch[1] : null);

              return (
                <Card
                  key={drive.id}
                  className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <CompanyLogo src={companyLogo} name={companyTitle} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm sm:text-base font-semibold text-[#1D1D1F] truncate">
                            {companyTitle}
                          </CardTitle>
                          <div className="flex items-center gap-1 shrink-0">
                            {drive.eligibility ? (
                              drive.eligibility.eligible ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                  ELIGIBLE
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                  INELIGIBLE
                                </span>
                              )
                            ) : null}
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20 whitespace-nowrap">
                              OPEN
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-[#0071E3] truncate">{jobTitle}</p>
                        {brochureUrl && (
                          <a
                            href={brochureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0071E3] hover:underline font-medium mt-0.5"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" /> Brochure
                          </a>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-[#F5F5F7]/70 p-3 rounded-2xl border border-black/[0.04]">
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-[#86868B] block">Package (CTC)</span>
                        <span className="font-semibold text-[#1D1D1F] truncate block">{ctcDisplay}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-[#86868B] block">Min CPI</span>
                        <span className="font-semibold text-[#0071E3] truncate block">
                          {drive.minCpi ? `${drive.minCpi} CPI` : "No Cutoff"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-[#86868B] block">Location</span>
                        <span className="font-medium text-[#1D1D1F] truncate block">{drive.location || "On-site"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-[#86868B] block">Deadline</span>
                        <span className="font-medium text-[#1D1D1F] truncate block">{deadlineDisplay}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider">
                        Eligible Branches
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {branchesList.length === 0 ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                            All Branches
                          </span>
                        ) : (
                          branchesList.map((b: string) => (
                            <span
                              key={b}
                              className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-medium text-[#1D1D1F] border border-black/[0.06]"
                            >
                              {b}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {drive.eligibility && !drive.eligibility.eligible && drive.eligibility.reasons?.length > 0 && (
                      <div className="rounded-2xl bg-rose-50/70 border border-rose-200/80 p-3 text-[11px] text-rose-900 space-y-1">
                        <div className="font-semibold flex items-center gap-1 text-rose-700">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          Ineligible Criteria:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-rose-800/90 text-[10.5px]">
                          {drive.eligibility.reasons.slice(0, 2).map((reason, i) => (
                            <li key={i} className="truncate" title={reason}>
                              {reason}
                            </li>
                          ))}
                          {drive.eligibility.reasons.length > 2 && (
                            <li className="text-[10px] text-rose-700 font-medium">
                              +{drive.eligibility.reasons.length - 2} more (click Details)
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        onClick={() => setDetailsModalDrive(drive)}
                        className="flex-1 text-xs font-medium h-9 gap-1.5 border-black/[0.1] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#86868B] shrink-0" /> Details
                      </Button>
                      {drive.eligibility && !drive.eligibility.eligible ? (
                        <Button
                          variant="outline"
                          onClick={() => setDetailsModalDrive(drive)}
                          className="flex-1 text-xs font-medium h-9 gap-1 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" /> Ineligible
                        </Button>
                      ) : isVerified ? (
                        <Button
                          variant="primary"
                          onClick={() => openApplyModal(drive.id)}
                          className="flex-1 text-xs font-medium h-9 gap-1.5 bg-[#0071E3] hover:bg-[#0077ED]"
                        >
                          <Send className="h-3.5 w-3.5 shrink-0" /> Apply
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => openApplyModal(drive.id)}
                          className="flex-1 text-xs font-medium h-9 gap-1 border-black/[0.1] text-amber-800 bg-amber-50 hover:bg-amber-100"
                        >
                          <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* TAB 2: APPLIED DRIVES */}
      {!isLoading && activeTab === "applied" && (
        filteredApplied.length === 0 ? (
          <Card className="rounded-3xl border border-black/[0.08] bg-white p-12 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <Send className="mx-auto h-10 w-10 text-[#A1A1A6]" />
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              {searchQuery ? "No matching applied drives" : "No Applications Submitted Yet"}
            </h3>
            <p className="text-xs text-[#86868B] max-w-sm mx-auto">
              {searchQuery
                ? "Try clearing your search query."
                : "You haven't submitted applications to any drives yet. Check the Upcoming Drives tab to apply."}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={() => setActiveTab("upcoming")}
                className="mt-2 text-xs font-semibold gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Explore Upcoming Drives
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredApplied.map((app) => {
              const drive = app.drive;
              const companyTitle = drive?.company?.name || (drive as any)?.companyName || "Recruiting Company";
              const jobRole = drive?.role || (drive as any)?.jobRole || "Engineering Role";
              const ctcDisplay = drive?.ctcMax
                ? `₹${drive.ctc} - ${drive.ctcMax} LPA`
                : drive?.ctc
                ? `₹${drive.ctc} LPA`
                : (drive as any)?.ctcPackage || "Competitive";
              const companyLogo = drive?.company?.imageUrl || (drive as any)?.companyLogo;

              const statusColor =
                app.status === "SELECTED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : app.status === "SHORTLISTED"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : app.status === "REJECTED"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-blue-50 text-blue-700 border-blue-200";

              return (
                <Card
                  key={app.id}
                  className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <CompanyLogo src={companyLogo} name={companyTitle} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm sm:text-base font-semibold text-[#1D1D1F] truncate">
                            {companyTitle}
                          </CardTitle>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10.5px] font-bold border whitespace-nowrap shrink-0 ${statusColor}`}>
                            {app.status === "SELECTED"
                              ? "🎉 SELECTED"
                              : app.status === "SHORTLISTED"
                              ? "⭐ SHORTLISTED"
                              : app.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#0071E3] truncate">{jobRole}</p>
                        <span className="text-[10px] text-[#86868B] block mt-0.5">
                          Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7]/70 p-3 rounded-2xl border border-black/[0.04]">
                      <div>
                        <span className="text-[10px] font-medium text-[#86868B] block">Package</span>
                        <span className="font-semibold text-[#1D1D1F]">{ctcDisplay}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[#86868B] block">Location</span>
                        <span className="font-medium text-[#1D1D1F] truncate block">
                          {drive?.location || "On-site"}
                        </span>
                      </div>
                    </div>

                    {/* Attendance Badge - Defaults to Present if moved past APPLIED */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                      <span className="text-[11px] font-semibold text-[#86868B] flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-[#0071E3]" /> Attendance Status:
                      </span>
                      {app.isPresent === true ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" /> Present
                        </span>
                      ) : app.isPresent === false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="h-3 w-3" /> Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>

                    {drive && (
                      <Button
                        variant="outline"
                        onClick={() => setDetailsModalDrive(drive)}
                        className="w-full text-xs font-medium h-9.5 gap-1.5 border-black/[0.1] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#86868B]" /> View Drive Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* TAB 3: PAST DRIVES */}
      {!isLoading && activeTab === "past" && (
        filteredPast.length === 0 ? (
          <Card className="rounded-3xl border border-black/[0.08] bg-white p-12 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <Clock className="mx-auto h-10 w-10 text-[#A1A1A6]" />
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              {searchQuery ? "No matching past drives" : "No Past Drives Found"}
            </h3>
            <p className="text-xs text-[#86868B] max-w-sm mx-auto">
              {searchQuery
                ? "Try clearing your search query."
                : "Completed and closed campus recruitment drives will appear here for archival reference."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredPast.map((drive) => {
              const companyTitle = drive.company?.name || (drive as any).companyName || "Recruiting Company";
              const jobTitle = drive.role || (drive as any).jobRole || "Engineering Role";
              const ctcDisplay = drive.ctcMax
                ? `₹${drive.ctc} - ${drive.ctcMax} LPA`
                : drive.ctc
                ? `₹${drive.ctc} LPA`
                : (drive as any).ctcPackage || "Competitive";
              const companyLogo = drive.company?.imageUrl || (drive as any).companyLogo;

              return (
                <Card
                  key={drive.id}
                  className="rounded-3xl border border-black/[0.08] bg-[#F5F5F7]/40 shadow-xs flex flex-col justify-between opacity-90 hover:opacity-100 transition-opacity"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <CompanyLogo src={companyLogo} name={companyTitle} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm sm:text-base font-semibold text-[#1D1D1F] truncate">
                            {companyTitle}
                          </CardTitle>
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 whitespace-nowrap shrink-0">
                            CLOSED
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#86868B] truncate">{jobTitle}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-black/[0.04]">
                      <div>
                        <span className="text-[10px] font-medium text-[#86868B] block">Package</span>
                        <span className="font-semibold text-[#1D1D1F]">{ctcDisplay}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[#86868B] block">Min CPI</span>
                        <span className="font-semibold text-[#1D1D1F]">
                          {drive.minCpi ? `${drive.minCpi} CPI` : "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[#86868B] block">Location</span>
                        <span className="font-medium text-[#1D1D1F] truncate block">
                          {drive.location || "On-site"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[#86868B] block">Status</span>
                        <span className="font-medium text-slate-500 block">Drive Concluded</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setDetailsModalDrive(drive)}
                      className="w-full text-xs font-medium h-9.5 gap-1.5 border-black/[0.1] text-[#1D1D1F] hover:bg-white"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#86868B]" /> View Archive Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* View Details Modal */}
      {detailsModalDrive && (
        <DriveDetailsModal
          drive={detailsModalDrive}
          onClose={() => setDetailsModalDrive(null)}
          onApply={(driveId) => openApplyModal(driveId)}
          isVerified={isVerified}
        />
      )}

      {/* Apply Modal */}
      {applyModalDriveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Close button */}
            <button
              onClick={closeApplyModal}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
            >
              <X className="h-4 w-4 text-[#86868B]" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Apply to Drive</h3>
              <p className="text-xs text-[#86868B]">
                Upload your resume and accept terms to submit your application.
              </p>
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#1D1D1F]">Resume (PDF) *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-[#0071E3]/30 bg-[#0071E3]/5 hover:bg-[#0071E3]/10 transition-colors text-xs font-medium text-[#0071E3]"
              >
                {resumeFile ? (
                  <>
                    <FileText className="h-4 w-4" />
                    {resumeFile.name}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Click to upload your resume PDF
                  </>
                )}
              </button>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#86868B] text-[#0071E3] focus:ring-[#0071E3]"
              />
              <span className="text-[11px] leading-relaxed text-[#3A3A3C]">
                I accept: <strong>&quot;If you cannot participate after applying, you will not be allowed for the upcoming placement journey.&quot;</strong>
              </span>
            </label>

            {/* Error in modal */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-[11px] font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={closeApplyModal}
                className="flex-1 text-xs h-10 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApply(applyModalDriveId)}
                isLoading={applyingDriveId === applyModalDriveId}
                disabled={!termsAccepted || !resumeFile}
                className="flex-1 text-xs h-10 rounded-xl gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" /> Submit Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
