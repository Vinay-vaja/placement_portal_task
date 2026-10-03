"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { tpoService } from "@/services/tpo.service";
import { StudentProfile, TpoAnalytics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ENGINEERING_BRANCHES } from "@/config/constants";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Loader2,
  GraduationCap,
  Award,
} from "lucide-react";

interface TPOStudentsTabProps {
  stats: TpoAnalytics | null;
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
  isExportingCsv?: boolean;
  isExportingXlsx?: boolean;
}

export function TPOStudentsTab({
  stats,
  onExportCsv,
  onExportXlsx,
  isExportingCsv = false,
  isExportingXlsx = false,
}: TPOStudentsTabProps) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await tpoService.getStudents({
        page,
        limit: 12,
        search: search.trim() || undefined,
        branch: branch !== "ALL" ? branch : undefined,
        verificationStatus: status !== "ALL" ? (status as any) : undefined,
      });

      if (res.data) {
        const raw = res.data as any;
        const list = raw.items || raw.data || (Array.isArray(raw) ? raw : []);
        setStudents(list);
        setTotalPages(raw.totalPages || raw.pagination?.totalPages || 1);
        setTotalCount(raw.total ?? raw.pagination?.total ?? list.length);
      }
    } catch (err: unknown) {
      console.error("Failed to load students:", err);
      toast.error((err as Error)?.message || "Failed to load students");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, branch, status]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const quickVerify = async (studentId: string, newStatus: "VERIFIED" | "REJECTED") => {
    try {
      await tpoService.verifyStudent(studentId, newStatus);
      toast.success(`Student profile marked as ${newStatus}`);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, verificationStatus: newStatus } : s))
      );
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update verification status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Total Enrolled</span>
          <div className="text-2xl font-bold text-[#1D1D1F] mt-1">
            {stats?.totalStudents ?? totalCount}
          </div>
          <p className="text-[11px] text-[#86868B] mt-0.5">All engineering streams</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Verified Profiles</span>
          <div className="text-2xl font-bold text-[#34C759] mt-1">
            {stats?.verifiedStudents ?? 0}
          </div>
          <p className="text-[11px] text-[#34C759] mt-0.5">Eligible for recruitment</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Pending Review</span>
          <div className="text-2xl font-bold text-[#FF9500] mt-1">
            {stats?.pendingVerification ?? 0}
          </div>
          <p className="text-[11px] text-[#FF9500] mt-0.5">Awaiting verification</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Placed Candidates</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.placedStudents ?? 0}
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5">
            {stats?.placementRate ?? 0}% Placement Rate
          </p>
        </div>
      </div>

      {/* Main Student Directory Card */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-black/[0.06] p-5 sm:p-6 bg-[#F5F5F7]/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#0071E3]" /> Student Directory & Verification
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B] mt-0.5">
                Search, filter, and inspect enrolled student profiles across all branches
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onExportCsv && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportCsv}
                  disabled={isExportingCsv}
                  className="gap-1.5 text-xs font-medium h-8.5 rounded-lg border-black/[0.08] bg-white hover:bg-neutral-50"
                >
                  <Download className="h-3.5 w-3.5 text-[#86868B]" />
                  {isExportingCsv ? "Exporting..." : "CSV"}
                </Button>
              )}
              {onExportXlsx && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportXlsx}
                  disabled={isExportingXlsx}
                  className="gap-1.5 text-xs font-medium h-8.5 rounded-lg border-black/[0.08] bg-white hover:bg-neutral-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#86868B]" />
                  {isExportingXlsx ? "Exporting..." : "Excel"}
                </Button>
              )}
              <Link href="/tpo/students">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-medium h-8.5 px-3.5 rounded-lg bg-[#0071E3] text-white hover:bg-[#0071E3]/90 shadow-xs"
                >
                  Full Verification Queue <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
              <Input
                placeholder="Search by name, enrollment, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-white border-black/[0.1] focus-visible:ring-[#0071E3]"
              />
            </div>

            <div>
              <select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 text-xs rounded-xl bg-white border border-black/[0.1] text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              >
                <option value="ALL">All Engineering Branches</option>
                {ENGINEERING_BRANCHES.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 text-xs rounded-xl bg-white border border-black/[0.1] text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              >
                <option value="ALL">All Verification Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#86868B]">
              <Loader2 className="h-6 w-6 animate-spin text-[#0071E3]" />
              <span className="text-xs">Loading registered students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-[#86868B]">
              <Users className="h-10 w-10 mx-auto text-[#86868B]/40 mb-2" />
              <p className="text-sm font-medium text-[#1D1D1F]">No students found</p>
              <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7]/60 text-[#86868B] font-medium border-b border-black/[0.06]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Branch & Stream</th>
                    <th className="py-3 px-4">Academic Scores</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Placement Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {students.map((student) => {
                    const isVerified = student.verificationStatus === "VERIFIED";
                    const isPending = student.verificationStatus === "PENDING";
                    const isRejected = student.verificationStatus === "REJECTED";

                    return (
                      <tr key={student.id} className="hover:bg-[#F5F5F7]/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] font-semibold text-xs shrink-0">
                              {student.fullName ? student.fullName.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1D1D1F] truncate">
                                {student.fullName}
                              </p>
                              <p className="text-[11px] text-[#86868B] truncate">
                                {(student as any).user?.email || student.phone || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#1D1D1F] px-1.5 py-0.5 rounded bg-black/[0.04]">
                            {student.branch}
                          </span>
                          <span className="ml-1.5 text-[11px] text-[#86868B]">
                            {student.studentType === "D2D" ? "D2D" : "Regular"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-[#86868B]">10th:</span>
                              <span className="font-medium text-[#1D1D1F]">
                                {student.tenthPercentage ? `${student.tenthPercentage}%` : "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-[#86868B]">
                                {student.studentType === "D2D" ? "D2D CGPA:" : "12th:"}
                              </span>
                              <span className="font-medium text-[#1D1D1F]">
                                {student.studentType === "D2D"
                                  ? student.d2dCgpa || "—"
                                  : student.twelfthPercentage
                                  ? `${student.twelfthPercentage}%`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isVerified ? (
                            <Badge className="bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20 font-medium gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </Badge>
                          ) : isPending ? (
                            <Badge className="bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 font-medium gap-1 text-[11px]">
                              <Clock className="h-3 w-3" /> Pending Review
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-[#FF3B30] border border-[#FF3B30]/20 font-medium gap-1 text-[11px]">
                              <XCircle className="h-3 w-3" /> Rejected
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {student.isPlaced ? (
                            <div>
                              <span className="font-semibold text-[#0071E3] text-xs">
                                Placed (₹{student.currentPackageLpa ?? 0} LPA)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#86868B]">Seeking Placement</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => quickVerify(student.id, "VERIFIED")}
                                className="h-7 px-2 text-[11px] font-medium border-[#34C759]/30 text-[#28A745] hover:bg-[#34C759]/10"
                                title="Approve Verification"
                              >
                                Approve
                              </Button>
                            )}
                            <Link href="/tpo/students">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[11px] font-medium text-[#0071E3] hover:bg-[#0071E3]/10"
                              >
                                Full Profile <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-black/[0.06] bg-[#F5F5F7]/30 text-xs text-[#86868B]">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total students)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
