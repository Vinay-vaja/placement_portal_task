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

  // Groq AI Refactoring & Template Presets State
  const [rawAiNotes, setRawAiNotes] = useState("");
  const [isRefactoringAi, setIsRefactoringAi] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customGroqKey, setCustomGroqKey] = useState("");
  const [selectedGroqModel, setSelectedGroqModel] = useState("llama-3.3-70b-versatile");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [announcementModalTab, setAnnouncementModalTab] = useState<"compose" | "preview">("compose");

  const PRESET_TEMPLATES = [
    {
      id: "drive",
      label: "🎯 Placement Drive",
      subject: "🚨 Campus Recruitment Drive: [Company Name] ([CTC] LPA)",
      sampleNotes:
        "TCS is visiting on Friday 10th October for CE, IT, AIML branches. Package 9 LPA. Online test at 10 AM in Computer Center Lab 1. Carry 2 printed resumes, photo ID, and verified marksheet copies.",
    },
    {
      id: "interview",
      label: "📅 Technical Interview",
      subject: "📅 Technical Interview & Assessment Schedule Update",
      sampleNotes:
        "Round 2 Technical Interviews for shortlisted candidates will begin tomorrow at 9:30 AM in the TPO Conference Hall. Formal college dress code and student ID card are mandatory.",
    },
    {
      id: "policy",
      label: "⚠️ Policy & Attendance",
      subject: "⚠️ Mandatory Notice: Placement Code of Conduct & Attendance Rules",
      sampleNotes:
        "All registered candidates must maintain 100% attendance in scheduled placement rounds. Unexcused absence after shortlisting will lead to immediate debarment under Central Placement regulations.",
    },
    {
      id: "deadline",
      label: "📝 Profile Deadline",
      subject: "📝 Urgent: Profile Locking & Marksheet Verification Deadline",
      sampleNotes:
        "All final year students must lock their profiles and submit verified semester 1-6 SPIs by Friday 5:00 PM. Unverified profiles will not be nominated for upcoming drives.",
    },
  ];

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setActivePresetId(preset.id);
    setRawAiNotes(preset.sampleNotes);
    if (!announcementForm.title) {
      setAnnouncementForm((prev) => ({ ...prev, title: preset.subject }));
    }
  };

  const handleRefactorWithGroq = async () => {
    if (!rawAiNotes.trim()) {
      alert("Please enter a few lines of rough notes or pick a preset template.");
      return;
    }

    try {
      setIsRefactoringAi(true);
      const res = await tpoService.refactorAnnouncement({
        rawNotes: rawAiNotes.trim(),
        templatePreset: activePresetId || "general",
        customApiKey: customGroqKey.trim() || undefined,
        customModel: selectedGroqModel || undefined,
      });

      if (res.data) {
        setAnnouncementForm((prev) => ({
          ...prev,
          title: res.data.subject || prev.title,
          body: res.data.htmlBody,
        }));
        setAiModelUsed(res.data.modelUsed);
        setAnnouncementModalTab("preview");
      }
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to refactor announcement with AI.");
    } finally {
      setIsRefactoringAi(false);
    }
  };

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

  const handleSendAnnouncement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-black/[0.08] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] p-5 sm:p-6 bg-[#FAFAFC]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#1D1D1F]">Campus Email Announcement</h3>
                    <Badge variant="outline" className="text-[10px] bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20">
                      Groq AI Powered
                    </Badge>
                  </div>
                  <p className="text-xs text-[#86868B]">
                    Broadcast HTML emails to students • Predefined templates or 2-line notes refactored by Groq AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="rounded-full p-2 text-[#86868B] hover:bg-black/[0.05] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {announcementSuccess && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>{announcementSuccess}</span>
                </div>
              )}

              {/* SECTION 1: PREDEFINED EMAIL TEMPLATES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                    <span>Predefined Email Templates</span>
                    <span className="text-[11px] font-normal text-[#86868B]">(Select to auto-populate)</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        activePresetId === preset.id
                          ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                          : "bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.06] hover:bg-white hover:border-[#0071E3]/40"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: GROQ AI QUICK REFACTOR */}
              <div className="rounded-2xl border border-[#0071E3]/20 bg-gradient-to-br from-[#0071E3]/[0.03] to-transparent p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0071E3] text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-[#1D1D1F]">
                      Groq AI HTML Email Refactor
                    </span>
                    <span className="text-[10px] text-[#86868B] font-mono bg-white px-2 py-0.5 rounded-full border border-black/[0.06]">
                      llama-3.3-70b-versatile
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-[11px] text-[#0071E3] hover:underline"
                  >
                    {showKeyInput ? "Hide API Key" : "Custom Groq Key"}
                  </button>
                </div>

                {showKeyInput && (
                  <div className="space-y-2.5 p-3 bg-white/70 rounded-xl border border-black/[0.06]">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#1D1D1F]">
                        Custom Groq API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="gsk_... (Leave blank to use server environment variable)"
                        value={customGroqKey}
                        onChange={(e) => setCustomGroqKey(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#1D1D1F]">
                        Groq Model
                      </label>
                      <select
                        value={selectedGroqModel}
                        onChange={(e) => setSelectedGroqModel(e.target.value)}
                        className="w-full h-8 rounded-lg border border-black/[0.1] bg-white px-2.5 text-xs text-[#1D1D1F] focus:border-[#0071E3] focus:outline-none"
                      >
                        <option value="llama-3.3-70b-versatile">
                          llama-3.3-70b-versatile (Recommended / High Quality)
                        </option>
                        <option value="llama-3.1-8b-instant">
                          llama-3.1-8b-instant (Fastest / Lightweight)
                        </option>
                        <option value="mixtral-8x7b-32768">
                          mixtral-8x7b-32768 (MoE Architecture)
                        </option>
                        <option value="gemma2-9b-it">
                          gemma2-9b-it (Google Gemma 2)
                        </option>
                      </select>
                      <p className="text-[10px] text-[#86868B]">
                        Configured in backend/.env via GROQ_API_KEY and GROQ_MODEL.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-[11px] text-[#86868B]">
                    Type 1 or 2 lines of rough notes (e.g. company name, date, package, rules). Groq will rewrite it into a responsive, corporate-styled HTML email.
                  </p>
                  <textarea
                    rows={3}
                    placeholder="e.g. Microsoft drive next Tuesday for CE/IT, 25 LPA CTC, reporting 9:00 AM at Lab 5. Bring 2 copies resume and ID card."
                    value={rawAiNotes}
                    onChange={(e) => setRawAiNotes(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.1] bg-white p-3 text-xs text-[#1D1D1F] focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {aiModelUsed && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      Refactored with: {aiModelUsed}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleRefactorWithGroq}
                    disabled={isRefactoringAi || !rawAiNotes.trim()}
                    className="ml-auto gap-2 text-xs shadow-sm bg-[#0071E3] hover:bg-[#0077ED]"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isRefactoringAi ? "animate-spin" : ""}`} />
                    {isRefactoringAi ? "Refactoring with Groq..." : "Enhance with Groq AI"}
                  </Button>
                </div>
              </div>

              {/* TABS: Visual Preview vs Source/Compose */}
              <div className="flex border-b border-black/[0.08] gap-4">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalTab("compose")}
                  className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
                    announcementModalTab === "compose"
                      ? "border-[#0071E3] text-[#0071E3]"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  ✏️ Subject & Source Editor
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementModalTab("preview")}
                  className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
                    announcementModalTab === "preview"
                      ? "border-[#0071E3] text-[#0071E3]"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  👁️ Live Email Preview
                </button>
              </div>

              {announcementModalTab === "compose" ? (
                /* COMPOSE / SOURCE TAB */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#1D1D1F]">Announcement Title / Email Subject *</label>
                    <Input
                      required
                      placeholder="e.g. 🚨 Campus Placement Drive: Microsoft (25 LPA) — Notice"
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
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[#1D1D1F]">Message Body (HTML Content Supported) *</label>
                      <button
                        type="button"
                        onClick={() => setAnnouncementModalTab("preview")}
                        className="text-[11px] text-[#0071E3] hover:underline"
                      >
                        Switch to Visual Preview →
                      </button>
                    </div>
                    <textarea
                      required
                      rows={7}
                      placeholder="Compose message or click 'Enhance with Groq AI' above to auto-generate beautiful HTML email code..."
                      value={announcementForm.body}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                      className="w-full rounded-2xl border border-black/[0.1] bg-[#F5F5F7]/80 p-3 font-mono text-[11px] text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* LIVE PREVIEW TAB */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-black/[0.08] bg-[#F5F5F7] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#86868B]">Subject:</span>
                      <span className="font-semibold text-[#1D1D1F]">{announcementForm.title || "(No subject set)"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#86868B]">
                      <span>To: <strong>{announcementForm.branch === "ALL" ? "All Branches" : announcementForm.branch}</strong></span>
                      <span>Type: <strong>{announcementForm.studentType}</strong></span>
                    </div>
                  </div>

                  {announcementForm.body ? (
                    <div className="rounded-2xl border border-black/[0.1] p-4 bg-white overflow-hidden shadow-xs">
                      <div
                        className="email-preview-container max-w-full overflow-x-auto text-sm"
                        dangerouslySetInnerHTML={{ __html: announcementForm.body }}
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#86868B] bg-[#F5F5F7] rounded-2xl border border-dashed border-black/[0.1]">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-[#86868B]" />
                      <p>No email content generated yet.</p>
                      <p className="text-[11px]">Type rough notes in the Groq AI composer or choose a preset template.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-black/[0.06] bg-[#FAFAFC]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAnnouncementModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {announcementModalTab === "compose" && announcementForm.body && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAnnouncementModalTab("preview")}
                    className="text-xs"
                  >
                    View Preview
                  </Button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSendAnnouncement}
                  disabled={isSendingAnnouncement || !announcementForm.title.trim() || !announcementForm.body.trim()}
                  className="gap-2 text-xs shadow-sm bg-[#0071E3] hover:bg-[#0077ED]"
                >
                  {isSendingAnnouncement ? (
                    "Broadcasting..."
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Send Announcement Email
                    </>
                  )}
                </Button>
              </div>
            </div>
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
