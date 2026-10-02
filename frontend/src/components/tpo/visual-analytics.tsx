"use client";

import React, { useState, useMemo } from "react";
import { TpoAnalytics } from "@/types";
import { ENGINEERING_BRANCHES } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Info,
} from "lucide-react";

interface VisualAnalyticsProps {
  stats: TpoAnalytics | null;
  isLoading: boolean;
  onExportCompanyWise?: (companyId?: string) => void;
}

export function VisualAnalytics({ stats, isLoading, onExportCompanyWise }: VisualAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "branches" | "packages">("overview");
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Derived metrics
  const totalStudents = stats?.totalStudents ?? 0;
  const placedStudents = stats?.placedStudents ?? stats?.totalPlaced ?? 0;
  const verifiedStudents = stats?.verifiedStudents ?? stats?.students?.verified ?? 0;
  const pendingStudents = stats?.pendingVerification ?? stats?.students?.pending ?? 0;
  const rejectedStudents = stats?.rejectedStudents ?? stats?.students?.rejected ?? 0;
  const dismissedStudents = stats?.students?.dismissed ?? 0;

  // Unplaced students who are verified and seeking jobs
  const seekingStudents = Math.max(0, verifiedStudents - placedStudents);
  const unplacedTotal = Math.max(0, totalStudents - placedStudents);

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

  // Salary tier calculations
  const salaryTiers = useMemo(() => {
    let dream = 0; // > 10 LPA
    let core = 0; // 6 - 10 LPA
    let standard = 0; // < 6 LPA

    companyWise.forEach((c) => {
      const hires = c.studentsHired || 0;
      const pkg = c.avgPackage || 0;
      if (pkg >= 10) dream += hires;
      else if (pkg >= 6) core += hires;
      else standard += hires;
    });

    const totalCalculated = dream + core + standard || placedStudents || 1;
    return {
      dream: { count: dream, percent: Math.round((dream / totalCalculated) * 100) },
      core: { count: core, percent: Math.round((core / totalCalculated) * 100) },
      standard: { count: standard, percent: Math.round((standard / totalCalculated) * 100) },
    };
  }, [companyWise, placedStudents]);

  // Donut chart segments calculation
  const donutData = useMemo(() => {
    const rawData = [
      { id: "placed", label: "Placed Students", value: placedStudents, color: "#10B981", lightColor: "#D1FAE5" },
      { id: "seeking", label: "Seeking Opportunities", value: seekingStudents, color: "#0071E3", lightColor: "#DBEAFE" },
      { id: "pending", label: "Pending Verification", value: pendingStudents, color: "#F59E0B", lightColor: "#FEF3C7" },
      { id: "rejected", label: "Profile Disapproved", value: rejectedStudents + dismissedStudents, color: "#EF4444", lightColor: "#FEE2E2" },
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
  }, [placedStudents, seekingStudents, pendingStudents, rejectedStudents, dismissedStudents, totalStudents]);

  // SVG Donut Path Generator
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const getDonutSlicePath = (startPercent: number, endPercent: number, radius = 80, innerRadius = 55) => {
    // Edge case: single 100% slice or empty
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

  // Max students hired by single company for relative bar scaling
  const maxCompanyHires = useMemo(() => {
    if (companyWise.length === 0) return 1;
    return Math.max(...companyWise.map((c) => c.studentsHired), 1);
  }, [companyWise]);

  // Max students placed in a branch
  const maxBranchPlaced = useMemo(() => {
    if (branchWise.length === 0) return 1;
    return Math.max(...branchWise.map((b) => b.placed), 1);
  }, [branchWise]);

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-black/[0.08] bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0071E3] border-t-transparent" />
          <p className="text-sm font-medium text-[#86868B]">Generating analytics visual charts...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Key Metrics Ribbon */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#0F355C] to-[#0071E3] p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Campus Placement Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Placement Statistics & Visuals</h2>
            <p className="text-xs text-white/80">
              Interactive graphical charts of student placements, corporate hiring rosters, and salary benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-center border border-white/15">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/70">Placement Rate</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{placementRate}%</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards in Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] font-medium text-white/70">Total Enrolled</span>
            <div className="text-xl sm:text-2xl font-bold">{totalStudents}</div>
            <span className="text-[10px] text-white/60">{regularCount} Reg • {d2dCount} D2D</span>
          </div>

          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] font-medium text-white/70">Total Placed</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300">{placedStudents}</div>
            <span className="text-[10px] text-white/60">Recruited students</span>
          </div>

          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] font-medium text-white/70">Highest Offer</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-300">
              ₹{highestLpa > 0 ? highestLpa.toFixed(2) : "0.00"}{" "}
              <span className="text-xs font-normal text-white/70">LPA</span>
            </div>
            <span className="text-[10px] text-white/60">Campus Benchmark</span>
          </div>

          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] font-medium text-white/70">Average CTC</span>
            <div className="text-xl sm:text-2xl font-bold text-cyan-300">
              ₹{averageLpa > 0 ? averageLpa.toFixed(2) : "0.00"}{" "}
              <span className="text-xs font-normal text-white/70">LPA</span>
            </div>
            <span className="text-[10px] text-white/60">Batch Average</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-3">
        {[
          { id: "overview", label: "Charts Overview", icon: PieChart },
          { id: "companies", label: `Company Selections (${companyWise.length})`, icon: Building2 },
          { id: "branches", label: "Branch Distribution", icon: GraduationCap },
          { id: "packages", label: "Salary Tiers & Highest LPA", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20"
                  : "bg-white text-[#86868B] hover:text-[#1D1D1F] border border-black/[0.08] hover:border-black/[0.15]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CHARTS OVERVIEW (Pie/Donut + Quick Visual Bars) */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart: Placement Ratio */}
          <Card className="lg:col-span-6 rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-[#0071E3]" /> Placement Ratio Donut Chart
                  </CardTitle>
                  <CardDescription className="text-xs text-[#86868B]">
                    Distribution of enrolled student placement status
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {totalStudents} Enrolled
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* SVG Donut Visual */}
              <div className="relative flex items-center justify-center">
                <svg className="w-52 h-52 sm:w-60 sm:h-60 -rotate-90 transform" viewBox="0 0 200 200">
                  {donutData.map((slice) => {
                    const startPercent = slice.startAngle / 360;
                    const endPercent = slice.endAngle / 360;
                    if (slice.value === 0) return null;
                    const path = getDonutSlicePath(startPercent, endPercent, 88, 58);
                    const isHovered = hoveredSlice === slice.id;
                    return (
                      <path
                        key={slice.id}
                        d={path}
                        fill={slice.color}
                        opacity={hoveredSlice && !isHovered ? 0.4 : 1}
                        className="transition-all duration-200 cursor-pointer hover:scale-105 transform origin-center"
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-medium text-[#86868B]">Placed</span>
                  <span className="text-3xl font-extrabold text-[#1D1D1F]">{placedStudents}</span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                    {placementRate}%
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="w-full sm:w-auto space-y-2.5">
                {donutData.map((slice) => {
                  const isHovered = hoveredSlice === slice.id;
                  return (
                    <div
                      key={slice.id}
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                        isHovered ? "bg-black/[0.05] scale-102" : "hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="text-xs font-medium text-[#1D1D1F]">{slice.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1D1D1F]">{slice.value}</span>
                        <span className="text-[11px] font-medium text-[#86868B]">({slice.percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Company-wise Selections Top Leaderboard Bar Chart */}
          <Card className="lg:col-span-6 rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#34C759]" /> Top Hiring Partners (Bar Chart)
                  </CardTitle>
                  <CardDescription className="text-xs text-[#86868B]">
                    Students recruited per company with average package
                  </CardDescription>
                </div>
                <button
                  onClick={() => setActiveTab("companies")}
                  className="text-xs font-semibold text-[#0071E3] hover:underline"
                >
                  View All ({companyWise.length})
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
                companyWise.slice(0, 5).map((comp, idx) => {
                  const barWidth = Math.round((comp.studentsHired / maxCompanyHires) * 100);
                  return (
                    <div key={comp.company} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-[#1D1D1F] truncate">{comp.company}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-[#0071E3]">₹{comp.avgPackage.toFixed(2)} LPA</span>
                          <span className="font-bold text-[#1D1D1F] bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                            {comp.studentsHired} Placed
                          </span>
                        </div>
                      </div>

                      {/* Interactive Progress Bar */}
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0071E3] to-[#5856D6] transition-all duration-500"
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
      {/* TAB 2: COMPANY SELECTIONS (Full Bar Chart & Roster) */}
      {/* ============================================================ */}
      {activeTab === "companies" && (
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0071E3]" /> Company-Wise Student Selection Roster
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B]">
                Interactive horizontal bar chart of all recruited candidates per hiring company
              </CardDescription>
            </div>
            {onExportCompanyWise && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportCompanyWise()}
                className="gap-1.5 text-xs font-medium h-8 border-black/[0.12] hover:bg-neutral-50 self-start sm:self-auto"
              >
                <Download className="h-3.5 w-3.5 text-[#5856D6]" /> Export Full Company Excel
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {companyWise.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#86868B]">
                No student selections registered yet. Selections will populate automatically as TPO or company marks
                candidates as &quot;SELECTED&quot;.
              </div>
            ) : (
              <div className="space-y-4">
                {companyWise.map((comp, idx) => {
                  const barWidth = Math.round((comp.studentsHired / maxCompanyHires) * 100);
                  const isSelected = selectedCompany === comp.company;

                  return (
                    <div
                      key={comp.company}
                      className="rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/30 p-4 hover:border-black/[0.12] transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-[#0071E3]">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-[#1D1D1F]">{comp.company}</h4>
                            <p className="text-[11px] text-[#86868B]">{comp.studentsHired} Candidates Selected</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-sm font-black text-[#0071E3]">
                              ₹{comp.avgPackage.toFixed(2)} LPA
                            </span>
                            <span className="block text-[10px] text-[#86868B]">Average Offer</span>
                          </div>

                          {comp.details && comp.details.length > 0 && (
                            <button
                              onClick={() => setSelectedCompany(isSelected ? null : comp.company)}
                              className="rounded-xl border border-black/[0.08] p-1.5 text-xs text-[#86868B] hover:bg-white transition-colors"
                              title="Toggle Candidate Details"
                            >
                              {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Visual Bar Indicator */}
                      <div className="space-y-1">
                        <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${Math.max(barWidth, 6)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#86868B] px-1">
                          <span>0</span>
                          <span>Hiring Share: {Math.round((comp.studentsHired / (placedStudents || 1)) * 100)}%</span>
                          <span>{maxCompanyHires} max</span>
                        </div>
                      </div>

                      {/* Selected Students Dropdown List */}
                      {isSelected && comp.details && (
                        <div className="rounded-xl bg-white p-3 border border-black/[0.06] space-y-2 mt-2">
                          <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider block">
                            Recruited Students List:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {comp.details.map((st, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-semibold text-slate-800">{st.name}</p>
                                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{st.role}</p>
                                </div>
                                <span className="font-bold text-emerald-600 text-[11px]">
                                  ₹{st.package ? st.package.toFixed(1) : comp.avgPackage.toFixed(1)} LPA
                                </span>
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
      {/* TAB 3: BRANCH DISTRIBUTION (Bar Chart) */}
      {/* ============================================================ */}
      {activeTab === "branches" && (
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
            <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" /> Department / Branch Placement Bar Chart
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Comparative analysis of registered candidates vs placed candidates across LDCE engineering branches
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="space-y-4">
              {ENGINEERING_BRANCHES.map((b) => {
                const totalInBranch = byBranch[b.code] ?? 0;
                const branchStat = branchWise.find((item) => item.branch === b.code);
                const placedInBranch = branchStat?.placed ?? 0;
                const avgBranchPkg = branchStat?.avgPackage ?? 0;
                const branchRate = totalInBranch > 0 ? Math.round((placedInBranch / totalInBranch) * 100) : 0;
                const barWidth = Math.round((placedInBranch / maxBranchPlaced) * 100);

                return (
                  <div
                    key={b.code}
                    className="p-3.5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/30 space-y-2 hover:bg-white hover:border-black/[0.12] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[#1D1D1F] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                          {b.code}
                        </span>
                        <span className="text-[#86868B] font-medium truncate max-w-[200px] sm:max-w-none">
                          {b.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#86868B] text-[11px]">
                          {placedInBranch} of {totalInBranch} Placed ({branchRate}%)
                        </span>
                        {placedInBranch > 0 && (
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            Avg: ₹{avgBranchPkg.toFixed(2)} LPA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dual Comparative Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.max(barWidth, placedInBranch > 0 ? 6 : 0)}%` }}
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
      {activeTab === "packages" && (
        <div className="space-y-6">
          {/* Highest Placement Spotlight Card */}
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 p-6 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">
                Highest Placement Package
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black">
              ₹{highestLpa > 0 ? highestLpa.toFixed(2) : "0.00"}{" "}
              <span className="text-lg font-semibold text-white/80">Lakhs Per Annum</span>
            </div>
            <p className="text-xs text-white/90">
              The highest confirmed compensation package secured by a candidate in this recruitment drive cycle.
            </p>
          </div>

          {/* Salary Tier Distribution Cards */}
          <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-xs p-6 space-y-6">
            <CardHeader className="p-0 pb-4 border-b border-black/[0.06]">
              <CardTitle className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0071E3]" /> CTC Salary Tier Distribution
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B]">
                Breakdown of placed offers by compensation tier bands
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tier 1: Dream Offers */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase">Dream Tier (&gt; 10 LPA)</span>
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-900">{salaryTiers.dream.count} Offers</div>
                <div className="h-2 rounded-full bg-purple-200 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${salaryTiers.dream.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-purple-700">{salaryTiers.dream.percent}% of total placed students</p>
              </div>

              {/* Tier 2: Core Offers */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase">Core Tier (6 - 10 LPA)</span>
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-900">{salaryTiers.core.count} Offers</div>
                <div className="h-2 rounded-full bg-blue-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${salaryTiers.core.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-blue-700">{salaryTiers.core.percent}% of total placed students</p>
              </div>

              {/* Tier 3: Standard Offers */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Standard Tier (&lt; 6 LPA)</span>
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900">{salaryTiers.standard.count} Offers</div>
                <div className="h-2 rounded-full bg-emerald-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${salaryTiers.standard.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-700">{salaryTiers.standard.percent}% of total placed students</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
