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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Central TPO Admin Dashboard
          </h1>
          <p className="text-xs md:text-sm text-blue-100 font-medium">
            Overview of campus recruitment drives, student academic verifications, and placement analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tpo/drives">
            <Button variant="secondary" className="gap-2 font-semibold shadow-sm text-xs bg-white text-blue-700 hover:bg-blue-50">
              <PlusCircle className="h-4 w-4" /> Create Drive
            </Button>
          </Link>
          <Link href="/tpo/students">
            <Button variant="outline" className="gap-2 font-semibold text-xs text-white border-white/30 hover:bg-white/10">
              <UserCheck className="h-4 w-4" /> Verify Students
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-black text-slate-900">
                {isLoading ? "..." : stats?.totalStudents ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-slate-500">Registered on Portal</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Profiles</p>
              <h3 className="text-2xl font-black text-slate-900">
                {isLoading ? "..." : stats?.verifiedStudents ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-emerald-600 font-semibold">
                {isLoading ? "" : `${stats?.pendingVerification ?? 0} pending review`}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Drives</p>
              <h3 className="text-2xl font-black text-slate-900">
                {isLoading ? "..." : stats?.activeDrives ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-slate-500">Open for applications</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placed Students</p>
              <h3 className="text-2xl font-black text-slate-900">
                {isLoading ? "..." : stats?.placedStudents ?? 0}
              </h3>
              <p className="text-[11px] font-medium text-indigo-600 font-semibold">Campus Selections</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Action & Operations */}
        <Card className="border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-900">
                  Quick Portal Operations
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Frequently used actions by the Central TPO team
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/tpo/students"
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white group-hover:scale-105 transition-transform">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  Student Verification Queue
                </h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Review student 10th, 12th/D2D marks, semester SPIs, and verify profiles.
                </p>
              </div>
            </Link>

            <Link
              href="/tpo/drives"
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-200 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600">
                  Create Recruitment Drive
                </h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Post new job openings, specify branch cutoffs, CTC, and eligibility rules.
                </p>
              </div>
            </Link>

            <a
              href={tpoService.exportStudentsUrl("csv")}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white group-hover:scale-105 transition-transform">
                <Download className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">
                  Export Student Records
                </h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Download verified student profiles, CPI list, and placement data as CSV/Excel.
                </p>
              </div>
            </a>

            <Link
              href="/tpo/settings"
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600">
                  Configure SPI Settings
                </h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Update required semester SPI count and toggle overall placement status.
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Verification Summary Side Widget */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Verification Queue
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">
                  {stats?.pendingVerification ?? 0} Students
                </h4>
                <p className="text-xs text-slate-500">
                  Waiting for academic profile approval from TPO cell.
                </p>
              </div>
              <Link href="/tpo/students?status=PENDING">
                <Button variant="primary" className="w-full mt-2 font-semibold text-xs shadow-md shadow-blue-500/20">
                  Review Pending Students <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
