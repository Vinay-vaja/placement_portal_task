"use client";

import React, { useEffect, useState, useRef } from "react";
import { driveService } from "@/services/drive.service";
import { RecruitmentDrive } from "@/types";
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
} from "lucide-react";

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);

  // Apply modal state
  const [applyModalDriveId, setApplyModalDriveId] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDrives = async () => {
    try {
      setIsLoading(true);
      const res = await driveService.getDrives();
      if (res.data?.data) {
        setDrives(res.data.data);
      } else {
        setDrives([]);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load active placement drives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const openApplyModal = (driveId: string) => {
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
      fetchDrives();
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
            Recruitment Drives
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Explore campus placement opportunities, check CPI cutoffs, and apply directly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
            {drives.length} Open Drives
          </span>
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
          {drives.map((drive) => (
            <Card
              key={drive.id}
              className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">
                        {drive.companyName}
                      </CardTitle>
                      <p className="text-xs font-medium text-[#0071E3]">{drive.jobRole}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20">
                    OPEN
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7]/70 p-3 rounded-2xl border border-black/[0.04]">
                  <div>
                    <span className="text-[10px] font-medium text-[#86868B] block">Package (CTC)</span>
                    <span className="font-semibold text-[#1D1D1F]">{drive.ctcPackage || "Competitive"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-[#86868B] block">Min CPI</span>
                    <span className="font-semibold text-[#0071E3]">{drive.minCpi} CPI</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-[#86868B] block">Location</span>
                    <span className="font-medium text-[#1D1D1F] truncate block">{drive.location || "On-site"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-[#86868B] block">Deadline</span>
                    <span className="font-medium text-[#1D1D1F] block">
                      {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : "Open"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider">
                    Eligible Branches
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {drive.eligibleBranches?.map((b) => (
                      <span
                        key={b}
                        className="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-[10px] font-medium text-[#1D1D1F] border border-black/[0.06]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => openApplyModal(drive.id)}
                  className="w-full text-xs font-medium h-9.5 gap-2 mt-2"
                >
                  <Send className="h-3.5 w-3.5" /> Apply for Placement
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
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
