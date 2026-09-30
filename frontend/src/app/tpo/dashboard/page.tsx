"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { tpoService } from "@/services/tpo.service";
import { TpoAnalytics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export default function TPODashboardPage() {
  const [stats, setStats] = useState<TpoAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 px-2 sm:px-4">
      {/* Apple Minimal Hero Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Placement Administration
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Central Training & Placement Cell • LDCE Campus Drive Management
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/tpo/drives">
            <Button variant="primary" size="sm" className="gap-2 text-xs font-medium h-9">
              <PlusCircle className="h-4 w-4" /> Create Drive
            </Button>
          </Link>
          <Link href="/tpo/students">
            <Button variant="outline" size="sm" className="gap-2 text-xs font-medium h-9">
              <UserCheck className="h-4 w-4" /> Verify Students
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.totalStudents ?? 0}
              </h3>
              <p className="text-[11px] text-[#86868B]">Registered on portal</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Verified Profiles</p>
              <h3 className="text-2xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.verifiedStudents ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-[#28A745]">
                {isLoading ? "" : `${stats?.pendingVerification ?? 0} pending review`}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#34C759]/10 text-[#28A745]">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Active Drives</p>
              <h3 className="text-2xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.activeDrives ?? 0}
              </h3>
              <p className="text-[11px] text-[#86868B]">Open for applications</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF9500]/10 text-[#D97706]">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Selections</p>
              <h3 className="text-2xl font-semibold text-[#1D1D1F]">
                {isLoading ? "..." : stats?.placedStudents ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-purple-600">Students placed</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] lg:col-span-2">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F]">
              Placement Cell Operations
            </CardTitle>
            <CardDescription className="text-xs text-[#86868B]">
              Quick management shortcuts for placement coordinators
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Link
              href="/tpo/students"
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-neutral-50 hover:border-black/[0.12] transition-all group"
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
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-neutral-50 hover:border-black/[0.12] transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF9500] text-white">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#FF9500] transition-colors">
                  Recruitment Drives
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Create new drives, company roles, CTC, and branch cutoffs.
                </p>
              </div>
            </Link>

            <a
              href={tpoService.exportStudentsUrl("csv")}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-neutral-50 hover:border-black/[0.12] transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34C759] text-white">
                <Download className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#34C759] transition-colors">
                  Export Student Records
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Download verified student profiles and CPI rankings as CSV/Excel.
                </p>
              </div>
            </a>

            <Link
              href="/tpo/settings"
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/40 hover:bg-neutral-50 hover:border-black/[0.12] transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-purple-600 transition-colors">
                  Portal Settings
                </h4>
                <p className="text-xs text-[#86868B] leading-snug">
                  Update SPI rules, semester counts, and placement status.
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Verification Summary Widget */}
        <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
          <CardHeader className="border-b border-black/[0.06] pb-4">
            <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D97706]" /> Verification Status
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3]">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-semibold text-[#1D1D1F]">
                {stats?.pendingVerification ?? 0} Students
              </h4>
              <p className="text-xs text-[#86868B]">
                Pending review and approval by Central TPO
              </p>
            </div>
            <Link href="/tpo/students?status=PENDING" className="block pt-2">
              <Button variant="primary" className="w-full text-xs font-medium h-10">
                Review Pending Profiles <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
