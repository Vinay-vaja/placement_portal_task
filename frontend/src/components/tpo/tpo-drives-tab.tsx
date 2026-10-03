"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { driveService } from "@/services/drive.service";
import { RecruitmentDrive, TpoAnalytics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  PlusCircle,
  Search,
  Building2,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  MapPin,
} from "lucide-react";

interface TPODrivesTabProps {
  stats: TpoAnalytics | null;
}

export function TPODrivesTab({ stats }: TPODrivesTabProps) {
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDrives = async () => {
    try {
      setIsLoading(true);
      const res = await driveService.getDrives({
        page,
        limit: 10,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });

      if (res.data) {
        const raw = res.data as any;
        let list = raw.items || raw.data || (Array.isArray(raw) ? raw : []);
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          list = list.filter(
            (d: any) =>
              (d.company?.name || d.companyName || "").toLowerCase().includes(q) ||
              (d.role || d.jobRole || "").toLowerCase().includes(q)
          );
        }
        setDrives(list);
        setTotalPages(raw.totalPages || raw.pagination?.totalPages || 1);
        setTotalCount(raw.total ?? raw.pagination?.total ?? list.length);
      }
    } catch (err: unknown) {
      console.error("Failed to load drives:", err);
      toast.error((err as Error)?.message || "Failed to load recruitment drives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrives();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Drives KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Total Drives</span>
          <div className="text-2xl font-bold text-[#1D1D1F] mt-1">
            {totalCount || stats?.activeDrives || 0}
          </div>
          <p className="text-[11px] text-[#86868B] mt-0.5">Recruitment campaigns</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Active & Open</span>
          <div className="text-2xl font-bold text-[#34C759] mt-1">
            {stats?.activeDrives ?? 0}
          </div>
          <p className="text-[11px] text-[#34C759] mt-0.5">Accepting student applications</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Total Placed</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.placedStudents ?? 0}
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5">From campus drives</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Highest Package</span>
          <div className="text-2xl font-bold text-[#0071E3] mt-1">
            ₹{stats?.packages?.highest ? stats.packages.highest.toFixed(2) : "0.00"} <span className="text-xs font-normal text-[#86868B]">LPA</span>
          </div>
          <p className="text-[11px] text-[#0071E3] mt-0.5">Maximum offer across drives</p>
        </div>
      </div>

      {/* Drives Management Card */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-black/[0.06] p-5 sm:p-6 bg-[#F5F5F7]/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#0071E3]" /> Placement Drives Management
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B] mt-0.5">
                Manage recruitment drives, eligibility rules, candidate shortlisting, and schedules
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/tpo/drives?create=true">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-medium h-8.5 px-3.5 rounded-lg bg-[#0071E3] text-white hover:bg-[#0071E3]/90 shadow-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Post New Drive
                </Button>
              </Link>
              <Link href="/tpo/drives">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium h-8.5 px-3.5 rounded-lg border-black/[0.08] bg-white hover:bg-neutral-50"
                >
                  Manage All Drives <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
              <Input
                placeholder="Search drives by company or role..."
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
                <option value="ALL">All Drive Statuses</option>
                <option value="ACTIVE">Active (Accepting Applications)</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="CLOSED">Closed / Completed</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#86868B]">
              <Loader2 className="h-6 w-6 animate-spin text-[#0071E3]" />
              <span className="text-xs">Loading placement drives...</span>
            </div>
          ) : drives.length === 0 ? (
            <div className="py-16 text-center text-[#86868B]">
              <Briefcase className="h-10 w-10 mx-auto text-[#86868B]/40 mb-2" />
              <p className="text-sm font-medium text-[#1D1D1F]">No drives found</p>
              <p className="text-xs mt-1">Get started by posting a new recruitment drive.</p>
              <Link href="/tpo/drives?create=true" className="inline-block mt-3">
                <Button size="sm" className="h-8 text-xs bg-[#0071E3] text-white">
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Post New Drive
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {drives.map((drive) => {
                const companyName = drive.company?.name || drive.companyName || "Partner Company";
                const role = drive.jobRole || drive.role || "Software Role";
                const ctc = drive.ctcPackage || (drive.ctc ? `₹${drive.ctc} LPA` : "Not Disclosed");
                const branches = drive.allowedBranches || drive.eligibleBranches || [];
                const applicantsCount = drive._count?.applications ?? 0;
                const isActive = drive.status === "ACTIVE";

                return (
                  <div
                    key={drive.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-[#F5F5F7]/40 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3] font-bold text-sm shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-[#1D1D1F]">{companyName}</h4>
                          <span className="text-xs text-[#86868B]">•</span>
                          <span className="text-xs font-medium text-[#0071E3]">{role}</span>
                          <Badge
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-[#34C759]/10 text-[#28A745] border-[#34C759]/20"
                                : "bg-black/[0.04] text-[#86868B] border-black/[0.08]"
                            }`}
                          >
                            {isActive ? "Active Drive" : drive.status || "Closed"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#86868B] flex-wrap">
                          <span className="font-semibold text-[#1D1D1F]">{ctc}</span>
                          {drive.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {drive.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-[#0071E3]" /> {applicantsCount} Applicants
                          </span>
                        </div>

                        {branches.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            <span className="text-[10px] text-[#86868B]">Branches:</span>
                            {branches.slice(0, 5).map((b) => (
                              <span
                                key={b}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] text-[#1D1D1F] font-medium"
                              >
                                {b}
                              </span>
                            ))}
                            {branches.length > 5 && (
                              <span className="text-[10px] text-[#86868B]">
                                +{branches.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link href={`/tpo/drives?driveId=${drive.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8.5 px-3 text-xs font-medium border-black/[0.08] hover:bg-neutral-50"
                        >
                          Manage Drive <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-black/[0.06] bg-[#F5F5F7]/30 text-xs text-[#86868B]">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total drives)
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
