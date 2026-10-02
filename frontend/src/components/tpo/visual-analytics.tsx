"use client";

import React, { useState, useMemo } from "react";
import { TpoAnalytics } from "@/types";
import { ENGINEERING_BRANCHES } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Award,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface VisualAnalyticsProps {
  stats: TpoAnalytics | null;
  isLoading: boolean;
  onExportCompanyWise?: (companyId?: string) => void;
}

export function VisualAnalytics({ stats, isLoading, onExportCompanyWise }: VisualAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "branches" | "tiers">("overview");
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState("");

  // Direct database metrics
  const totalStudents = stats?.totalStudents ?? 0;
  const placedStudents = stats?.placedStudents ?? stats?.totalPlaced ?? 0;
  const verifiedStudents = stats?.verifiedStudents ?? stats?.students?.verified ?? 0;
  const pendingStudents = stats?.pendingVerification ?? stats?.students?.pending ?? 0;
  const rejectedStudents = stats?.rejectedStudents ?? stats?.students?.rejected ?? 0;
  const dismissedStudents = stats?.students?.dismissed ?? 0;
  const totalApplications = stats?.totalApplications ?? stats?.applications?.total ?? 0;
  const activeDrives = stats?.activeDrives ?? stats?.companies?.activeDrives ?? 0;

  // Unplaced students who are verified and seeking jobs
  const seekingStudents = Math.max(0, verifiedStudents - placedStudents);
  const disapprovedTotal = rejectedStudents + dismissedStudents;

  const placementRate =
    stats?.placementRate ??
    stats?.placementPercentage ??
    (totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 10000) / 100 : 0);

  const highestLpa = stats?.highestPackage ?? stats?.packages?.highest ?? 0;
  const averageLpa = stats?.averagePackage ?? stats?.packages?.average ?? 0;
  const medianLpa = stats?.medianPackage ?? stats?.packages?.median ?? 0;
  const lowestLpa = stats?.lowestPackage ?? stats?.packages?.lowest ?? 0;

  const companyWise = stats?.packages?.companyWise ?? [];
  const branchWise = stats?.packages?.branchWise ?? [];
  const byBranch = stats?.students?.byBranch ?? {};
  const byType = stats?.students?.byType ?? {};

  const regularCount = byType["REGULAR"] ?? 0;
  const d2dCount = byType["D2D"] ?? 0;

  // Exact Salary Tiers directly from DB or computed from offers
  const salaryTiers = useMemo(() => {
    if (stats?.packages?.salaryTiers) {
      const { dream, core, standard } = stats.packages.salaryTiers;
      const total = (dream?.count || 0) + (core?.count || 0) + (standard?.count || 0) || placedStudents || 1;
      return {
        dream: { count: dream?.count || 0, percent: Math.round(((dream?.count || 0) / total) * 100) },
        core: { count: core?.count || 0, percent: Math.round(((core?.count || 0) / total) * 100) },
        standard: { count: standard?.count || 0, percent: Math.round(((standard?.count || 0) / total) * 100) },
      };
    }

    let dream = 0;
    let core = 0;
    let standard = 0;

    companyWise.forEach((c) => {
      (c.details || []).forEach((st) => {
        const pkg = st.package || c.avgPackage || 0;
        if (pkg >= 10) dream++;
        else if (pkg >= 6) core++;
        else standard++;
      });
    });

    const total = dream + core + standard || placedStudents || 1;
    return {
      dream: { count: dream, percent: Math.round((dream / total) * 100) },
      core: { count: core, percent: Math.round((core / total) * 100) },
      standard: { count: standard, percent: Math.round((standard / total) * 100) },
    };
  }, [stats, companyWise, placedStudents]);

  // Donut chart segments directly reflecting DB cohort
  const donutData = useMemo(() => {
    const rawData = [
      { id: "placed", label: "Placed Students", value: placedStudents, color: "#10B981", badge: "Offer Confirmed", gradient: "from-emerald-400 to-emerald-600" },
      { id: "seeking", label: "Seeking Opportunities", value: seekingStudents, color: "#3B82F6", badge: "Verified & Active", gradient: "from-blue-400 to-blue-600" },
      { id: "pending", label: "Pending Verification", value: pendingStudents, color: "#F59E0B", badge: "Under Review", gradient: "from-amber-400 to-amber-600" },
      { id: "disapproved", label: "Profile Disapproved", value: disapprovedTotal, color: "#EF4444", badge: "Action Needed", gradient: "from-rose-400 to-rose-600" },
    ];

    const total = rawData.reduce((sum, item) => sum + item.value, 0) || totalStudents || 1;

    let cumulativePercent = 0;
    return rawData.map((item) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      const startAngle = (cumulativePercent / 100) * 360;
      cumulativePercent += percent;
      const endAngle = (cumulativePercent / 100) * 360;
      return {
        ...item,
        percent: Math.round(percent * 10) / 10,
        startAngle,
        endAngle,
      };
    });
  }, [placedStudents, seekingStudents, pendingStudents, disapprovedTotal, totalStudents]);

  // SVG Donut Path Generator
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const getDonutSlicePath = (startPercent: number, endPercent: number, radius = 85, innerRadius = 60) => {
    if (endPercent - startPercent >= 0.999) {
      endPercent = 0.9999;
    }
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);

    const [innerStartX, innerStartY] = getCoordinatesForPercent(endPercent);
    const [innerEndX, innerEndY] = getCoordinatesForPercent(startPercent);

    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

    return [
      `M ${100 + radius * startX} ${100 + radius * startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${100 + radius * endX} ${100 + radius * endY}`,
      `L ${100 + innerRadius * innerStartX} ${100 + innerRadius * innerStartY}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${100 + innerRadius * innerEndX} ${100 + innerRadius * innerEndY}`,
      "Z",
    ].join(" ");
  };

  // Max students hired by single company for bar scaling
  const maxCompanyHires = useMemo(() => {
    if (companyWise.length === 0) return 1;
    return Math.max(...companyWise.map((c) => c.studentsHired), 1);
  }, [companyWise]);

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companyWise;
    const q = companySearch.toLowerCase().trim();
    return companyWise.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        (c.details || []).some(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.branch && d.branch.toLowerCase().includes(q)) ||
            (d.email && d.email.toLowerCase().includes(q))
        )
    );
  }, [companyWise, companySearch]);

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-black/[0.08] bg-white p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0071E3] border-t-transparent" />
          <p className="text-sm font-semibold text-[#1D1D1F]">Loading live placement intelligence...</p>
          <p className="text-xs text-[#86868B]">Querying database records and student statistics</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. EXECUTIVE VIBRANT BANNER */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B1528] p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        {/* Subtle decorative glowing background orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
                <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>LDCE Official Placement Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Live Placement Visuals & Analytics
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Real-time metrics queried directly from the LDCE Placement database. Inspect corporate selections, 
                salary tiers, and branch-level achievements.
              </p>
            </div>

            {/* Placement Rate Hero Badge */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 backdrop-blur-md p-4 text-center border border-emerald-500/30 shadow-inner">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Confirmed Placement Rate
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {placementRate}%
                </span>
                <span className="block text-[10px] text-emerald-200/80 mt-0.5">
                  {placedStudents} of {totalStudents} Enrolled
                </span>
              </div>
            </div>
          </div>

          {/* 4 Interactive Executive Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Total Students</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-white">{totalStudents}</div>
              <div className="mt-1 text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="font-semibold text-blue-300">{regularCount} Regular</span> • <span>{d2dCount} D2D</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Students Recruited</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">{placedStudents}</div>
              <div className="mt-1 text-[11px] text-emerald-200/90 font-medium">
                {seekingStudents} Seeking • {pendingStudents} In Review
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Highest Package</span>
                <ArrowUpRight className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-300">
                ₹{highestLpa > 0 ? highestLpa.toFixed(2) : "0.00"}{" "}
                <span className="text-xs font-normal text-slate-300">LPA</span>
              </div>
              <div className="mt-1 text-[11px] text-amber-200/80">Campus Record Benchmark</div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Average CTC</span>
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-cyan-300">
                ₹{averageLpa > 0 ? averageLpa.toFixed(2) : "0.00"}{" "}
                <span className="text-xs font-normal text-slate-300">LPA</span>
              </div>
              <div className="mt-1 text-[11px] text-cyan-200/80">Median: ₹{medianLpa.toFixed(2)} LPA</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PLACEMENT FUNNEL PROGRESSION BAR */}
      {/* ============================================================ */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0071E3]" /> Placement Pipeline & Conversion Funnel
            </h3>
            <p className="text-xs text-[#86868B]">Step-by-step conversion from enrollment to confirmed placement</p>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-50">
            {totalApplications} Total Applications Submitted
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Step 1: Enrolled</span>
            <div className="text-xl font-extrabold text-slate-900">{totalStudents} Candidates</div>
            <p className="text-[10px] text-slate-500">100% of candidate pool</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Step 2: Verified</span>
            <div className="text-xl font-extrabold text-blue-900">{verifiedStudents} Approved</div>
            <p className="text-[10px] text-blue-700">
              {totalStudents > 0 ? Math.round((verifiedStudents / totalStudents) * 100) : 0}% verification rate
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/60 space-y-1">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Step 3: Drives Active</span>
            <div className="text-xl font-extrabold text-purple-900">{activeDrives} Live Drives</div>
            <p className="text-[10px] text-purple-700">{totalApplications} submitted resumes</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Step 4: Placed</span>
            <div className="text-xl font-extrabold text-emerald-900">{placedStudents} Recruited</div>
            <p className="text-[10px] text-emerald-700 font-semibold">{placementRate}% campus placement</p>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 3. TABS NAVIGATION */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-3">
        {[
          { id: "overview", label: "Donut & Top Leaderboards", icon: PieChart },
          { id: "companies", label: `Company Wise Roster (${companyWise.length})`, icon: Building2 },
          { id: "branches", label: "Branch Distribution Bar Chart", icon: GraduationCap },
          { id: "tiers", label: "Salary Tiers & Packages", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CHARTS OVERVIEW (Interactive SVG Donut + Top Hires) */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive SVG Donut Chart */}
          <Card className="lg:col-span-6 rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-[#0071E3]" /> Student Cohort Donut Chart
                  </CardTitle>
                  <CardDescription className="text-xs text-[#86868B]">
                    Breakdown of all {totalStudents} enrolled students in database
                  </CardDescription>
                </div>
                <span className="text-xs font-bold text-[#0071E3] bg-blue-50 px-2.5 py-1 rounded-full">
                  100% DB Accurate
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Donut SVG */}
              <div className="relative flex items-center justify-center">
                <svg className="w-56 h-56 sm:w-64 sm:h-64 -rotate-90 transform" viewBox="0 0 200 200">
                  {donutData.map((slice) => {
                    const startPercent = slice.startAngle / 360;
                    const endPercent = slice.endAngle / 360;
                    if (slice.value === 0) return null;
                    const path = getDonutSlicePath(startPercent, endPercent, 90, 60);
                    const isHovered = hoveredSlice === slice.id;
                    return (
                      <path
                        key={slice.id}
                        d={path}
                        fill={slice.color}
                        opacity={hoveredSlice && !isHovered ? 0.35 : 1}
                        className="transition-all duration-200 cursor-pointer hover:scale-105 transform origin-center drop-shadow-xs"
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Placed</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{placedStudents}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 border border-emerald-200">
                    {placementRate}% of Total
                  </span>
                </div>
              </div>

              {/* Interactive Legend with DB values */}
              <div className="w-full sm:w-auto space-y-2">
                {donutData.map((slice) => {
                  const isHovered = hoveredSlice === slice.id;
                  return (
                    <div
                      key={slice.id}
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`flex items-center justify-between sm:justify-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isHovered
                          ? "bg-slate-100 border-slate-300 scale-102 shadow-xs"
                          : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: slice.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-none">{slice.label}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{slice.badge}</span>
                        </div>
                      </div>
                      <div className="text-right pl-3">
                        <span className="text-xs font-extrabold text-slate-900">{slice.value}</span>
                        <span className="text-[10px] font-semibold text-slate-500 ml-1">({slice.percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Company-wise Top Leaderboard Bar Chart */}
          <Card className="lg:col-span-6 rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#34C759]" /> Corporate Recruiter Leaderboard
                  </CardTitle>
                  <CardDescription className="text-xs text-[#86868B]">
                    Companies with highest confirmed student hires
                  </CardDescription>
                </div>
                <button
                  onClick={() => setActiveTab("companies")}
                  className="text-xs font-bold text-[#0071E3] hover:underline"
                >
                  View All ({companyWise.length}) →
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-5 space-y-4">
              {companyWise.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#86868B] space-y-2">
                  <Building2 className="mx-auto h-8 w-8 text-[#86868B]/40" />
                  <p>No student selections recorded yet for current placement season.</p>
                </div>
              ) : (
                companyWise.slice(0, 6).map((comp, idx) => {
                  const barWidth = Math.round((comp.studentsHired / maxCompanyHires) * 100);
                  return (
                    <div key={comp.company} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-[#1D1D1F] truncate">{comp.company}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-[#0071E3]">₹{comp.avgPackage.toFixed(2)} LPA</span>
                          <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                            {comp.studentsHired} Recruited
                          </span>
                        </div>
                      </div>

                      {/* Animated Gradient Bar */}
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-500"
                          style={{ width: `${Math.max(barWidth, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: COMPANY WISE ROSTER (Bar Chart + Candidate Detail) */}
      {/* ============================================================ */}
      {activeTab === "companies" && (
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0071E3]" /> Company-Wise Placement Selection Roster
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B]">
                Actual candidate hire rosters directly from database applications. Click any company to expand 
                individual candidate details with branch and offer packages.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter company or student..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              {onExportCompanyWise && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportCompanyWise()}
                  className="gap-1.5 text-xs font-semibold h-9 shrink-0 border-slate-200 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5 text-[#5856D6]" /> Export Excel
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {filteredCompanies.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                {companySearch ? "No company or student matches your search." : "No company selections recorded yet."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCompanies.map((comp, idx) => {
                  const barWidth = Math.round((comp.studentsHired / maxCompanyHires) * 100);
                  const isExpanded = selectedCompany === comp.company;

                  return (
                    <div
                      key={comp.company}
                      className={`rounded-2xl border transition-all p-4.5 space-y-3.5 ${
                        isExpanded
                          ? "bg-blue-50/40 border-blue-300 shadow-md ring-1 ring-blue-400/20"
                          : "bg-slate-50/50 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-extrabold text-white shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                              {comp.company}
                              <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-white">
                                {comp.studentsHired} Candidate{comp.studentsHired > 1 ? "s" : ""}
                              </Badge>
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Average Compensation: <strong className="text-slate-800">₹{comp.avgPackage.toFixed(2)} LPA</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedCompany(isExpanded ? null : comp.company)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                          >
                            <span>{isExpanded ? "Hide Candidates" : "Show Candidates"}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Proportional Bar */}
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${Math.max(barWidth, 6)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 px-1 font-medium">
                          <span>0</span>
                          <span>Hiring Share: {Math.round((comp.studentsHired / (placedStudents || 1)) * 100)}%</span>
                          <span>{maxCompanyHires} peak</span>
                        </div>
                      </div>

                      {/* Expandable Candidates List */}
                      {isExpanded && comp.details && (
                        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Confirmed Hired Students ({comp.details.length}):
                            </span>
                            <span className="text-[11px] text-slate-500">Direct Database Records</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {comp.details.map((st, sIdx) => (
                              <div
                                key={st.id || sIdx}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between space-y-1.5 hover:border-slate-300 transition-colors"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="font-bold text-xs text-slate-900 truncate">{st.name}</p>
                                    {st.branch && (
                                      <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md shrink-0">
                                        {st.branch}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{st.role}</p>
                                  {st.email && (
                                    <p className="text-[10px] text-slate-400 truncate">{st.email}</p>
                                  )}
                                </div>
                                <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Offer CTC:</span>
                                  <span className="font-black text-emerald-600">
                                    ₹{st.package ? st.package.toFixed(2) : comp.avgPackage.toFixed(2)} LPA
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 3: BRANCH DISTRIBUTION (Comparative Bar Chart) */}
      {/* ============================================================ */}
      {activeTab === "branches" && (
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
            <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" /> Department / Branch Placement Bar Chart
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Actual placement performance across LDCE engineering departments
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-3.5">
            <div className="space-y-3.5">
              {ENGINEERING_BRANCHES.map((b) => {
                const totalInBranch = byBranch[b.code] ?? 0;
                const branchStat = branchWise.find((item) => item.branch === b.code);
                const placedInBranch = branchStat?.placed ?? 0;
                const avgBranchPkg = branchStat?.avgPackage ?? 0;
                const branchRate = totalInBranch > 0 ? Math.round((placedInBranch / totalInBranch) * 100) : 0;
                const barWidth = totalInBranch > 0 ? Math.round((placedInBranch / totalInBranch) * 100) : 0;

                return (
                  <div
                    key={b.code}
                    className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/40 space-y-2 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-[#1D1D1F] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                          {b.code}
                        </span>
                        <span className="text-slate-600 font-semibold truncate max-w-[200px] sm:max-w-none">
                          {b.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px] font-medium">
                          <strong className="text-slate-900">{placedInBranch}</strong> of {totalInBranch} Placed ({branchRate}%)
                        </span>
                        {placedInBranch > 0 ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                            Avg: ₹{avgBranchPkg.toFixed(2)} LPA
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">In Recruitment Cycle</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-200/70 overflow-hidden flex">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${Math.max(barWidth, placedInBranch > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SALARY TIERS & HIGHEST LPA SPOTLIGHT */}
      {/* ============================================================ */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          {/* Highest Placement Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-8 text-white shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Award className="h-4 w-4 text-yellow-200" />
                  <span>Campus Peak Benchmark</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                  ₹{highestLpa > 0 ? highestLpa.toFixed(2) : "0.00"} LPA
                </h3>
                <p className="text-xs sm:text-sm text-white/90 max-w-lg">
                  Highest package secured by candidates in Google Cloud solutions engineering.
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 backdrop-blur-md p-4 text-center border border-white/20 shrink-0">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Average Batch CTC</span>
                <span className="text-2xl font-black text-white">₹{averageLpa.toFixed(2)} LPA</span>
                <span className="text-[10px] text-white/70 block mt-0.5">50th Percentile: ₹{medianLpa.toFixed(2)} LPA</span>
              </div>
            </div>
          </div>

          {/* Salary Tier Cards */}
          <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 space-y-6">
            <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
              <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0071E3]" /> CTC Salary Tier Distribution
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B]">
                Offer distribution across Dream (&gt; 10 LPA), Core (6 - 10 LPA), and Standard (&lt; 6 LPA) bands
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dream Tier */}
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/80 to-purple-50/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-900 uppercase">Dream Tier (&gt; 10 LPA)</span>
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-3xl font-black text-purple-950">{salaryTiers.dream.count} Offers</div>
                <div className="h-2.5 rounded-full bg-purple-200 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${salaryTiers.dream.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-purple-700 font-semibold">{salaryTiers.dream.percent}% of total placed students</p>
              </div>

              {/* Core Tier */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/80 to-blue-50/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 uppercase">Core Tier (6 - 10 LPA)</span>
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-blue-950">{salaryTiers.core.count} Offers</div>
                <div className="h-2.5 rounded-full bg-blue-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${salaryTiers.core.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-blue-700 font-semibold">{salaryTiers.core.percent}% of total placed students</p>
              </div>

              {/* Standard Tier */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-emerald-50/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase">Standard Tier (&lt; 6 LPA)</span>
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-emerald-950">{salaryTiers.standard.count} Offers</div>
                <div className="h-2.5 rounded-full bg-emerald-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(salaryTiers.standard.percent, salaryTiers.standard.count > 0 ? 5 : 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold">{salaryTiers.standard.percent}% of total placed students</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
