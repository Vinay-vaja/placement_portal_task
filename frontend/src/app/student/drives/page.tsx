"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { driveService } from "@/services/drive.service";
import { studentService } from "@/services/student.service";
import { RecruitmentDrive, StudentProfile } from "@/types";
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
} from "lucide-react";

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

          {isVerified ? (
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
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
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
      const [drivesRes, profileRes] = await Promise.allSettled([
        driveService.getDrives(),
        studentService.getProfile(),
      ]);

      if (drivesRes.status === "fulfilled" && drivesRes.value?.data?.data) {
        setDrives(drivesRes.value.data.data);
      } else {
        setDrives([]);
      }

      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        setStudentProfile(profileRes.value.data);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load active placement drives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivesAndProfile();
  }, []);

  const isVerified = studentProfile?.verificationStatus === "VERIFIED";

  const openApplyModal = (driveId: string) => {
    if (!studentProfile?.profileLocked) {
      setErrorMessage("Please complete and submit your academic profile before applying to drives.");
      return;
    }
    if (!isVerified) {
      setErrorMessage(
        `Your profile status is ${studentProfile?.verificationStatus || "PENDING"}. Central TPO verification is required before you can apply to drives.`
      );
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
      return;
    }
    if (!resumeFile) {
      setErrorMessage("Please upload your resume PDF before applying.");
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
      setSuccessMessage("Application submitted successfully!");
      closeApplyModal();
      fetchDrivesAndProfile();
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to submit application. Make sure your profile is verified.");
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
            Upcoming Recruitment Drives
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Explore campus placement opportunities, check CPI cutoffs, and apply directly.
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
            {drives.length} Open Drives
          </span>
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

      {/* Drives List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#86868B]">
          Loading recruitment drives...
        </div>
      ) : drives.length === 0 ? (
        <Card className="rounded-3xl border border-black/[0.08] bg-white p-12 text-center space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <Building2 className="mx-auto h-10 w-10 text-[#A1A1A6]" />
          <h3 className="text-sm font-semibold text-[#1D1D1F]">No Open Drives Currently</h3>
          <p className="text-xs text-[#86868B] max-w-sm mx-auto">
            Check back later as new companies are added by the Central TPO team.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drives.map((drive) => {
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
                className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CompanyLogo src={companyLogo} name={companyTitle} />
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] truncate">
                          {companyTitle}
                        </CardTitle>
                        <p className="text-xs font-medium text-[#0071E3] truncate">{jobTitle}</p>
                        {brochureUrl && (
                          <a
                            href={brochureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0071E3] hover:underline font-medium mt-0.5"
                          >
                            <ExternalLink className="h-3 w-3" /> Brochure
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20 shrink-0">
                      OPEN
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-1 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7]/70 p-3 rounded-2xl border border-black/[0.04]">
                    <div>
                      <span className="text-[10px] font-medium text-[#86868B] block">Package (CTC)</span>
                      <span className="font-semibold text-[#1D1D1F]">{ctcDisplay}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-[#86868B] block">Min CPI</span>
                      <span className="font-semibold text-[#0071E3]">
                        {drive.minCpi ? `${drive.minCpi} CPI` : "No Cutoff"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-[#86868B] block">Location</span>
                      <span className="font-medium text-[#1D1D1F] truncate block">{drive.location || "On-site"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-[#86868B] block">Deadline</span>
                      <span className="font-medium text-[#1D1D1F] block">{deadlineDisplay}</span>
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
                            className="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-[10px] font-medium text-[#1D1D1F] border border-black/[0.06]"
                          >
                            {b}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => setDetailsModalDrive(drive)}
                      className="flex-1 text-xs font-medium h-9.5 gap-1.5 border-black/[0.1] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#86868B]" /> View Details
                    </Button>
                    {isVerified ? (
                      <Button
                        variant="primary"
                        onClick={() => openApplyModal(drive.id)}
                        className="flex-1 text-xs font-medium h-9.5 gap-1.5 bg-[#0071E3] hover:bg-[#0077ED]"
                      >
                        <Send className="h-3.5 w-3.5" /> Apply
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => openApplyModal(drive.id)}
                        className="flex-1 text-xs font-medium h-9.5 gap-1 border-black/[0.1] text-amber-800 bg-amber-50 hover:bg-amber-100"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-600" /> Apply
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
