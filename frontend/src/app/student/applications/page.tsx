"use client";

import React, { useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import { Application } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationDetailModal } from "@/components/applications/application-detail-modal";
import {
  FileCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  ChevronRight,
} from "lucide-react";

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getApplications();
      const raw = res.data as any;
      if (Array.isArray(raw)) {
        setApplications(raw);
      } else if (raw?.data && Array.isArray(raw.data)) {
        setApplications(raw.data);
      } else {
        setApplications([]);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load application history");
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const appList = Array.isArray(applications) ? applications : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Track status updates for campus placement drives and click any application to view full details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
            {appList.length} Submissions
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-4 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#86868B]">
              Loading application history...
            </div>
          ) : appList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileCheck className="mx-auto h-10 w-10 text-[#A1A1A6]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">No Applications Submitted Yet</h3>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Visit the &quot;Recruitment Drives&quot; tab to explore open placement opportunities and apply.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-[#F5F5F7]/60 text-[11px] font-medium text-[#86868B]">
                    <th className="py-3.5 px-4">Company Name</th>
                    <th className="py-3.5 px-4">Job Role</th>
                    <th className="py-3.5 px-4">CTC Package</th>
                    <th className="py-3.5 px-4">Application Date</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] text-xs text-[#1D1D1F]">
                  {appList.map((app) => {
                    const companyTitle = app.drive?.company?.name || app.drive?.companyName || "Company";
                    const roleTitle = app.drive?.role || app.drive?.jobRole || "Engineering Role";
                    const ctcDisplay = app.drive?.ctcMax
                      ? `₹${app.drive.ctc} - ${app.drive.ctcMax} LPA`
                      : app.drive?.ctc
                      ? `₹${app.drive.ctc} LPA`
                      : app.drive?.ctcPackage || "Competitive";
                    const appliedDate = app.appliedAt || app.createdAt
                      ? new Date(app.appliedAt || app.createdAt).toLocaleDateString()
                      : "Recently";

                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="hover:bg-[#0071E3]/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                          <div className="flex items-center gap-2.5">
                            {app.drive?.company?.imageUrl ? (
                              <img
                                src={app.drive.company.imageUrl}
                                alt={companyTitle}
                                className="h-7 w-7 rounded-xl object-contain border border-black/[0.08] bg-white p-0.5 shrink-0"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0071E3]/10 text-[#0071E3] shrink-0">
                                <Building2 className="h-4 w-4" />
                              </div>
                            )}
                            <span className="group-hover:text-[#0071E3] transition-colors">
                              {companyTitle}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1D1D1F]">
                          {roleTitle}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0071E3]">
                          {ctcDisplay}
                        </td>
                        <td className="py-3.5 px-4 text-[#86868B]">
                          {appliedDate}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {app.status === "SELECTED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#34C759]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#28A745] border border-[#34C759]/20">
                                <Award className="h-3.5 w-3.5 text-[#28A745]" /> Selected
                              </span>
                            ) : app.status === "REJECTED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF3B30]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                                <XCircle className="h-3.5 w-3.5 text-[#FF3B30]" /> Not Selected
                              </span>
                            ) : app.status === "SHORTLISTED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-[#0071E3] border border-[#0071E3]/20">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#0071E3]" /> Shortlisted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D97706] border border-[#FF9500]/20">
                                <Clock className="h-3.5 w-3.5 text-[#D97706]" /> Under Review
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-[#86868B] group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Modal */}
      <ApplicationDetailModal
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  );
}
