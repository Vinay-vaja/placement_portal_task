"use client";

import React from "react";
import { Application } from "@/types";
import { Button } from "@/components/ui/button";
import {
  X,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";

interface ApplicationDetailModalProps {
  application: Application | null;
  onClose: () => void;
}

export function ApplicationDetailModal({
  application,
  onClose,
}: ApplicationDetailModalProps) {
  if (!application) return null;

  const drive = (application.drive || {}) as any;
  const company = (drive.company || {}) as any;
  const companyTitle = company.name || drive.companyName || "Recruiting Company";
  const jobRole = drive.role || drive.jobRole || "Engineering Role";
  const ctcDisplay = drive.ctcMax
    ? `₹${drive.ctc} - ${drive.ctcMax} LPA`
    : drive.ctc
    ? `₹${drive.ctc} LPA`
    : drive.ctcPackage || "Competitive";
  const locationDisplay = drive.location || "On-site";
  const deadlineDisplay = drive.applicationDeadline
    ? new Date(drive.applicationDeadline).toLocaleDateString()
    : "Open";
  const appliedDate = application.appliedAt
    ? new Date(application.appliedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently";

  const branchesList = drive.allowedBranches || drive.eligibleBranches || [];

  // Extract brochure URL if present in description
  const brochureMatch = (drive.description || "").match(/Brochure:\s*(https?:\/\/[^\s]+)/i);
  const brochureUrl = drive.brochureUrl || (brochureMatch ? brochureMatch[1] : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 text-[#86868B]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          {company.imageUrl ? (
            <img
              src={company.imageUrl}
              alt={companyTitle}
              className="h-14 w-14 rounded-2xl object-contain border border-black/[0.08] bg-white p-1.5 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3] shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
          )}

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                {companyTitle}
              </h2>
              {/* Status Badge */}
              {application.status === "SELECTED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-3 py-1 text-xs font-semibold text-[#28A745] border border-[#34C759]/20">
                  <Award className="h-3.5 w-3.5" /> Selected
                </span>
              ) : application.status === "REJECTED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF3B30]/10 px-3 py-1 text-xs font-semibold text-[#FF3B30] border border-[#FF3B30]/20">
                  <XCircle className="h-3.5 w-3.5" /> Not Selected
                </span>
              ) : application.status === "SHORTLISTED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0071E3] border border-[#0071E3]/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Shortlisted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9500]/10 px-3 py-1 text-xs font-semibold text-[#D97706] border border-[#FF9500]/20">
                  <Clock className="h-3.5 w-3.5" /> Under Review
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#0071E3]">{jobRole}</p>
            <p className="text-xs text-[#86868B]">
              Submitted on {appliedDate}
            </p>
          </div>
        </div>

        {/* Highlight Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F5F7]/70 p-4 rounded-2xl border border-black/[0.04] text-xs">
          <div>
            <span className="text-[10px] font-medium text-[#86868B] uppercase block">Package</span>
            <span className="font-semibold text-[#1D1D1F]">{ctcDisplay}</span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-[#86868B] uppercase block">Location</span>
            <span className="font-medium text-[#1D1D1F]">{locationDisplay}</span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-[#86868B] uppercase block">Min CPI</span>
            <span className="font-semibold text-[#0071E3]">
              {drive.minCpi ? `${drive.minCpi} CPI` : "No Cutoff"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-[#86868B] uppercase block">Deadline</span>
            <span className="font-medium text-[#1D1D1F]">{deadlineDisplay}</span>
          </div>
        </div>

        {/* Eligible Branches */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#86868B] uppercase tracking-wider block">
            Eligible Engineering Branches
          </span>
          <div className="flex flex-wrap gap-1.5">
            {branchesList.length === 0 ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                All Engineering Branches Eligible
              </span>
            ) : (
              branchesList.map((b: string) => (
                <span
                  key={b}
                  className="rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-medium text-[#1D1D1F] border border-black/[0.06]"
                >
                  {b}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Job Description */}
        {drive.description && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[#0071E3]" /> Job Description & Requirements
            </h4>
            <div className="p-4 rounded-2xl bg-[#F5F5F7]/50 border border-black/[0.04] text-xs text-[#1D1D1F] space-y-2 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {drive.description}
            </div>
          </div>
        )}

        {/* Submitted Resume PDF Link */}
        <div className="space-y-2 pt-2 border-t border-black/[0.06]">
          <h4 className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
            Submitted Application Assets
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/15">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-[#0071E3]" />
              <div>
                <span className="text-xs font-semibold text-[#1D1D1F] block">
                  Uploaded Resume PDF
                </span>
                <span className="text-[11px] text-[#86868B]">
                  Official document submitted for TPO review
                </span>
              </div>
            </div>
            {application.resumeUrl ? (
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-medium hover:bg-[#0077ED] transition-colors shadow-sm"
              >
                View Resume PDF <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-xs font-medium text-[#86868B]">
                Resume File Attached
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full text-xs h-10 rounded-xl"
          >
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}
