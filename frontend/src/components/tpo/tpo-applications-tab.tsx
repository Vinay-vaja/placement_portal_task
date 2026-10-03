"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { tpoService } from "@/services/tpo.service";
import { Application, TpoAnalytics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  ChevronRight,
  Loader2,
  Building2,
  Users,
} from "lucide-react";

interface TPOApplicationsTabProps {
  stats: TpoAnalytics | null;
}

export function TPOApplicationsTab({ stats }: TPOApplicationsTabProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await tpoService.getApplications({
        page,
        limit: 12,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });

      if (res.data) {
        let list = res.data.data || [];
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          list = list.filter((app) => {
            const studentName = (app as any).student?.fullName || "";
            const email = (app as any).student?.user?.email || "";
            const comp = app.drive?.company?.name || (app.drive as any)?.companyName || "";
            const role = app.drive?.jobRole || (app.drive as any)?.role || "";
            return (
              studentName.toLowerCase().includes(q) ||
              email.toLowerCase().includes(q) ||
              comp.toLowerCase().includes(q) ||
              role.toLowerCase().includes(q)
            );
          });
        }
        setApplications(list);
        setTotalPages((res.data as any).totalPages || (res.data as any).pagination?.totalPages || 1);
        setTotalCount((res.data as any).total ?? (res.data as any).pagination?.total ?? list.length);
      }
    } catch (err: unknown) {
      console.error("Failed to load applications:", err);
      toast.error((err as Error)?.message || "Failed to load drive applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (appId: string, newStatus: "APPLIED" | "SHORTLISTED" | "SELECTED" | "REJECTED") => {
    try {
      setUpdatingId(appId);
      await tpoService.updateApplicationStatus(appId, newStatus);
      toast.success(`Application updated to ${newStatus}`);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED":
        return (
          <Badge className="bg-purple-50 text-purple-600 border-purple-200 font-medium gap-1 text-[11px]">
            <Award className="h-3 w-3" /> Selected
          </Badge>
        );
      case "SHORTLISTED":
        return (
          <Badge className="bg-[#34C759]/10 text-[#28A745] border-[#34C759]/20 font-medium gap-1 text-[11px]">
            <CheckCircle2 className="h-3 w-3" /> Shortlisted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-50 text-[#FF3B30] border-[#FF3B30]/20 font-medium gap-1 text-[11px]">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20 font-medium gap-1 text-[11px]">
            <Clock className="h-3 w-3" /> Applied
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Applications Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Total Applications</span>
          <div className="text-2xl font-bold text-[#1D1D1F] mt-1">
            {stats?.totalApplications ?? totalCount}
          </div>
          <p className="text-[11px] text-[#86868B] mt-0.5">Across all recruitment drives</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Shortlisted</span>
          <div className="text-2xl font-bold text-[#34C759] mt-1">
            {stats?.applications?.byStatus?.SHORTLISTED ?? 0}
          </div>
          <p className="text-[11px] text-[#34C759] mt-0.5">Advanced to interview rounds</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Offers Accepted</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.placedStudents ?? stats?.applications?.byStatus?.SELECTED ?? 0}
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5">Final selections placed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Attendance Rate</span>
          <div className="text-2xl font-bold text-[#0071E3] mt-1">
            {stats?.attendanceRate ?? 0}%
          </div>
          <p className="text-[11px] text-[#0071E3] mt-0.5">Drive test & interview turnout</p>
        </div>
      </div>

      {/* Main Applications Table Card */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-black/[0.06] p-5 sm:p-6 bg-[#F5F5F7]/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0071E3]" /> Student Drive Applications
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B] mt-0.5">
                Track candidate applications, update interview round status, and monitor selections
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/tpo/drives">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-medium h-8.5 px-3.5 rounded-lg border-black/[0.08] bg-white hover:bg-neutral-50"
                >
                  <Building2 className="h-3.5 w-3.5 text-[#0071E3]" /> View Drive Applicants by Company
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
              <Input
                placeholder="Search by student name or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-white border-black/[0.1] focus-visible:ring-[#0071E3]"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 text-xs rounded-xl bg-white border border-black/[0.1] text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              >
                <option value="ALL">All Application Statuses</option>
                <option value="APPLIED">Applied (Pending)</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="SELECTED">Selected (Placed)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#86868B]">
              <Loader2 className="h-6 w-6 animate-spin text-[#0071E3]" />
              <span className="text-xs">Loading drive applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center text-[#86868B]">
              <FileText className="h-10 w-10 mx-auto text-[#86868B]/40 mb-2" />
              <p className="text-sm font-medium text-[#1D1D1F]">No applications found</p>
              <p className="text-xs mt-1">Student drive registrations will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7]/60 text-[#86868B] font-medium border-b border-black/[0.06]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Recruitment Drive</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {applications.map((app) => {
                    const student = (app as any).student;
                    const drive = app.drive;
                    const companyName = drive?.company?.name || (drive as any)?.companyName || "Company";
                    const role = drive?.jobRole || (drive as any)?.role || "Role";

                    return (
                      <tr key={app.id} className="hover:bg-[#F5F5F7]/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] font-semibold text-xs shrink-0">
                              {student?.fullName ? student.fullName.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1D1D1F] truncate">
                                {student?.fullName || "Student"}
                              </p>
                              <p className="text-[11px] text-[#86868B] truncate">
                                {student?.branch || "Branch"} • {student?.studentType || "Regular"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-semibold text-[#1D1D1F]">{companyName}</span>
                            <span className="block text-[11px] text-[#86868B]">{role}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[#86868B]">
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>

                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={app.status}
                            disabled={updatingId === app.id}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value as any)
                            }
                            className="h-7 px-2 text-[11px] rounded-lg bg-white border border-black/[0.12] text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] cursor-pointer"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SHORTLISTED">Shortlist</option>
                            <option value="SELECTED">Select (Place)</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-black/[0.06] bg-[#F5F5F7]/30 text-xs text-[#86868B]">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total applications)
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
