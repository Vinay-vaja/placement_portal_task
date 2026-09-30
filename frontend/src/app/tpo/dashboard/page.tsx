"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { tpoService } from "@/services/tpo.service";
import { TpoAnalytics, EmailLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ENGINEERING_BRANCHES } from "@/config/constants";
import {
  Users,
  UserCheck,
  Briefcase,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Download,
  AlertCircle,
  Building2,
  TrendingUp,
  Mail,
  Send,
  History,
  FileSpreadsheet,
  X,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function TPODashboardPage() {
  const [stats, setStats] = useState<TpoAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Export states
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // Email Announcement Modal State
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    branch: "ALL",
    studentType: "ALL" as "ALL" | "REGULAR" | "D2D",
  });

  // Email Logs Modal State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const res = await tpoService.getDashboardStats();
        if (res.data) {
          setStats(res.data);
        }
      } catch (err: unknown) {
        setErrorMessage((err as Error)?.message || "Failed to load dashboard analytics");
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleExportStudents = async (format: "csv" | "xlsx") => {
    try {
      if (format === "csv") setIsExportingCsv(true);
      else setIsExportingXlsx(true);
      await tpoService.exportStudents(format);
    } catch (err: unknown) {
      alert((err as Error)?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      if (format === "csv") setIsExportingCsv(false);
      else setIsExportingXlsx(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      alert("Please fill in both announcement subject and message.");
      return;
    }

    try {
      setIsSendingAnnouncement(true);
      setAnnouncementSuccess(null);
      const res = await tpoService.sendAnnouncement({
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        branch: announcementForm.branch !== "ALL" ? announcementForm.branch : undefined,
        studentType: announcementForm.studentType !== "ALL" ? announcementForm.studentType : undefined,
      });

      setAnnouncementSuccess(
        res.data?.message || `Announcement queued successfully to recipients!`
      );
      setAnnouncementForm({
        title: "",
        body: "",
        branch: "ALL",
        studentType: "ALL",
      });
      setTimeout(() => {
        setAnnouncementModalOpen(false);
        setAnnouncementSuccess(null);
      }, 2500);
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to send email announcement");
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const handleOpenEmailLogs = async () => {
    setLogsModalOpen(true);
    try {
      setIsLoadingLogs(true);
      const res = await tpoService.getEmailLogs({ limit: 50 });
      if (res.data?.data) {
        setEmailLogs(res.data.data);
      } else {
        setEmailLogs([]);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch email logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Safely extract analytics values
  const pkg = stats?.packages;
  const highestLpa = pkg?.highest ?? (stats as any)?.highestPackage ?? 0;
  const averageLpa = pkg?.average ?? (stats as any)?.averagePackage ?? 0;
  const medianLpa = pkg?.median ?? 0;
  const lowestLpa = pkg?.lowest ?? 0;
  const placementRate = stats?.placementRate ?? 0;
  const attendanceRate = stats?.attendanceRate ?? 0;
  const companyWise = pkg?.companyWise ?? [];
  const branchWise = pkg?.branchWise ?? [];
  const byBranch = stats?.students?.byBranch ?? {};
  const byStatus = stats?.applications?.byStatus ?? {};
  const regularCount = stats?.students?.byType?.REGULAR ?? 0;
  const d2dCount = stats?.students?.byType?.D2D ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 px-2 sm:px-4">
      {/* Apple Minimal Hero Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#0071E3]/10 text-[#0071E3] uppercase">
              <Sparkles className="h-3 w-3" /> Live Analytics
            </span>
            <span className="text-xs text-[#86868B]">Central Placement Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Placement & Analytics Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Central Training & Placement Cell • LDCE Campus Drive Monitoring & Student Pipeline
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Email Announcement */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnnouncementModalOpen(true)}
            className="gap-1.5 text-xs font-medium h-9 border-black/[0.12] hover:bg-neutral-50"
          >
            <Mail className="h-4 w-4 text-[#0071E3]" /> Broadcast Email
          </Button>

          {/* Email Logs */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEmailLogs}
            className="gap-1.5 text-xs font-medium h-9 border-black/[0.12] hover:bg-neutral-50"
          >
            <History className="h-4 w-4 text-[#86868B]" /> Email Logs
          </Button>

          {/* Quick Exports */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportStudents("csv")}
            disabled={isExportingCsv}
            className="gap-1.5 text-xs font-medium h-9 border-black/[0.12] hover:bg-neutral-50"
          >
            <Download className="h-4 w-4 text-[#34C759]" />
            {isExportingCsv ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportStudents("xlsx")}
            disabled={isExportingXlsx}
            className="gap-1.5 text-xs font-medium h-9 border-black/[0.12] hover:bg-neutral-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#0071E3]" />
            {isExportingXlsx ? "Exporting..." : "Export Excel"}
          </Button>

          {/* Create Drive */}
          <Link href="/tpo/drives">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs font-medium h-9 shadow-sm">
              <PlusCircle className="h-4 w-4" /> New Drive
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-4 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-black/[0.15] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Total Enrolled</p>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.totalStudents ?? 0}
              </h3>
              <p className="text-[11px] text-[#86868B]">
                {regularCount} Regular • {d2dCount} D2D
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3]">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Verified Profiles */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-black/[0.15] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Verified Profiles</p>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.verifiedStudents ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-[#FF9500]">
                {isLoading ? "" : `${stats?.pendingVerification ?? 0} pending review`}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34C759]/10 text-[#34C759]">
              <UserCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Drives */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-black/[0.15] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Recruitment Drives</p>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.activeDrives ?? 0}
              </h3>
              <p className="text-[11px] text-[#86868B]">Accepting applications</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Selections & Placement Rate */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-black/[0.15] transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Total Placed</p>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.placedStudents ?? 0}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-purple-600">
                  {placementRate}% Placement Rate
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTC Package & Salary Analytics Banner */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-black/[0.06] bg-[#F5F5F7]/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0071E3]" />
                Salary & Package Intelligence (LPA)
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B]">
                Compensation package statistics for placed batch candidates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20 font-medium text-[11px]">
                Drive Attendance Rate: {attendanceRate}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#F5F5F7]/60 border border-black/[0.04] space-y-1">
              <span className="text-[11px] font-medium text-[#86868B] uppercase">Highest Package</span>
              <div className="text-2xl font-bold text-[#1D1D1F]">
                ₹{highestLpa > 0 ? highestLpa.toFixed(2) : "0.00"}{" "}
                <span className="text-xs font-normal text-[#86868B]">LPA</span>
              </div>
              <p className="text-[11px] text-[#28A745] font-medium">Campus Benchmark</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F7]/60 border border-black/[0.04] space-y-1">
              <span className="text-[11px] font-medium text-[#86868B] uppercase">Average Package</span>
              <div className="text-2xl font-bold text-[#0071E3]">
                ₹{averageLpa > 0 ? averageLpa.toFixed(2) : "0.00"}{" "}
                <span className="text-xs font-normal text-[#86868B]">LPA</span>
              </div>
              <p className="text-[11px] text-[#86868B]">Overall Batch Average</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F7]/60 border border-black/[0.04] space-y-1">
              <span className="text-[11px] font-medium text-[#86868B] uppercase">Median Package</span>
              <div className="text-2xl font-bold text-[#1D1D1F]">
                ₹{medianLpa > 0 ? medianLpa.toFixed(2) : "0.00"}{" "}
                <span className="text-xs font-normal text-[#86868B]">LPA</span>
              </div>
              <p className="text-[11px] text-[#86868B]">50th Percentile</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F7]/60 border border-black/[0.04] space-y-1">
              <span className="text-[11px] font-medium text-[#86868B] uppercase">Base / Lowest</span>
              <div className="text-2xl font-bold text-[#1D1D1F]">
                ₹{lowestLpa > 0 ? lowestLpa.toFixed(2) : "0.00"}{" "}
                <span className="text-xs font-normal text-[#86868B]">LPA</span>
              </div>
              <p className="text-[11px] text-[#86868B]">Minimum Offer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company-wise Hiring Ranking */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#0071E3]" /> Company Hiring & CTC Rankings
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Number of recruits and average package offered per corporate partner
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {companyWise.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#86868B]">
                No company selections recorded yet for current academic year.
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06]">
                {companyWise.map((comp, idx) => (
                  <div key={comp.company} className="flex items-center justify-between p-4 hover:bg-[#F5F5F7]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F5F5F7] text-xs font-semibold text-[#86868B]">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">{comp.company}</h4>
                        <p className="text-[11px] text-[#86868B]">{comp.studentsHired} Students Selected</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-[#0071E3]">
                        ₹{comp.avgPackage.toFixed(2)} LPA
                      </span>
                      <span className="block text-[10px] text-[#86868B]">Avg Package</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch-wise Placement & Student Breakdown */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" /> Departmental Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Registered candidates and placement statistics across engineering branches
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[360px] overflow-y-auto divide-y divide-black/[0.06]">
              {ENGINEERING_BRANCHES.map((b) => {
                const totalInBranch = byBranch[b.code] ?? 0;
                const branchStat = branchWise.find((item) => item.branch === b.code);
                const placedInBranch = branchStat?.placed ?? 0;
                const avgBranchPkg = branchStat?.avgPackage ?? 0;

                return (
                  <div key={b.code} className="flex items-center justify-between p-3.5 hover:bg-[#F5F5F7]/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1D1D1F]">{b.code}</span>
                        <span className="text-[11px] text-[#86868B] truncate max-w-[150px] sm:max-w-none">{b.name}</span>
                      </div>
                      <span className="text-[10px] text-[#86868B]">
                        {totalInBranch} Enrolled • {placedInBranch} Placed
                      </span>
                    </div>

                    <div className="text-right">
                      {placedInBranch > 0 ? (
                        <div>
                          <span className="text-xs font-semibold text-[#28A745]">
                            ₹{avgBranchPkg.toFixed(2)} LPA
                          </span>
                          <span className="block text-[10px] text-[#86868B]">Avg CTC</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#86868B] font-medium">In Pipeline</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations & Verification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations Navigation */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] lg:col-span-2">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F]">
              Management & Operations
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Quick administrative workflows for placement officers
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Link
              href="/tpo/students"
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-white hover:border-black/[0.12] hover:shadow-sm transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3] text-white">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                  Student Verification Queue
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Inspect student 10th marks, CPIs, and verify profiles.
                </p>
              </div>
            </Link>

            <Link
              href="/tpo/drives"
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-white hover:border-black/[0.12] hover:shadow-sm transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF9500] text-white">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#FF9500] transition-colors">
                  Recruitment Drives
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Create new drives, company roles, CTC ranges, and branch cutoffs.
                </p>
              </div>
            </Link>

            <button
              onClick={() => handleExportStudents("csv")}
              className="flex items-start text-left gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-white hover:border-black/[0.12] hover:shadow-sm transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34C759] text-white">
                <Download className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#34C759] transition-colors">
                  Export Student Records
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Download verified student profiles, CPIs, and packages as CSV/Excel.
                </p>
              </div>
            </button>

            <button
              onClick={() => setAnnouncementModalOpen(true)}
              className="flex items-start text-left gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-white hover:border-black/[0.12] hover:shadow-sm transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3] text-white">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                  Send Campus Broadcast
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Send email announcements directly to candidate inboxes.
                </p>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Verification Summary & Quick Action */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D97706]" /> Verification Status
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3]">
              <UserCheck className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F]">
                {stats?.pendingVerification ?? 0} Students
              </h4>
              <p className="text-xs text-[#86868B]">
                Pending review and profile approval by Central TPO
              </p>
            </div>

            <div className="pt-2">
              <Link href="/tpo/students" className="block">
                <Button variant="primary" className="w-full text-xs font-medium h-10 shadow-sm">
                  Review Pending Profiles <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EMAIL ANNOUNCEMENT MODAL */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-black/[0.08] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3]/10 text-[#0071E3]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">Campus Email Announcement</h3>
                  <p className="text-xs text-[#86868B]">Broadcast updates to student inboxes</p>
                </div>
              </div>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-[#F5F5F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {announcementSuccess && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{announcementSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1D1D1F]">Announcement Title / Subject *</label>
                <Input
                  required
                  placeholder="e.g. Mandatory Placement Orientation & Aptitude Prep"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#1D1D1F]">Target Branch</label>
                  <select
                    value={announcementForm.branch}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, branch: e.target.value })}
                    className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
                  >
                    <option value="ALL">All Engineering Branches</option>
                    {ENGINEERING_BRANCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#1D1D1F]">Student Type</label>
                  <select
                    value={announcementForm.studentType}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        studentType: e.target.value as "ALL" | "REGULAR" | "D2D",
                      })
                    }
                    className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
                  >
                    <option value="ALL">All Students (Regular & D2D)</option>
                    <option value="REGULAR">Regular Students Only</option>
                    <option value="D2D">D2D Students Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1D1D1F]">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Compose your campus notification message here..."
                  value={announcementForm.body}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                  className="w-full rounded-2xl border border-black/[0.1] bg-[#F5F5F7]/80 p-3 text-xs text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSendingAnnouncement}
                  className="gap-2 text-xs"
                >
                  {isSendingAnnouncement ? (
                    "Broadcasting..."
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Send Announcement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL LOGS MODAL */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-white border border-black/[0.08] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">Email Delivery History</h3>
                  <p className="text-xs text-[#86868B]">Audit trail of automated and broadcast campus emails</p>
                </div>
              </div>
              <button
                onClick={() => setLogsModalOpen(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-[#F5F5F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingLogs ? (
                <div className="p-8 text-center text-xs text-[#86868B]">
                  Loading email records...
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#86868B]">
                  No email delivery records found.
                </div>
              ) : (
                <div className="divide-y divide-black/[0.06] text-xs">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="py-3 px-1 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1D1D1F]">{log.recipientEmail}</span>
                          <Badge
                            variant={log.status === "SENT" ? "success" : "destructive"}
                            className="text-[10px] py-0 px-2"
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#1D1D1F]">{log.subject}</p>
                        {log.errorMessage && (
                          <p className="text-[10px] text-[#FF3B30] font-medium">{log.errorMessage}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-[#86868B] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-black/[0.06] text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogsModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
