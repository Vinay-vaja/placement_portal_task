"use client";

import React, { useEffect, useState } from "react";
import { studentService } from "@/services/student.service";
import { Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
} from "lucide-react";

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getApplications();
      if (res.data) {
        setApplications(res.data);
      } else {
        setApplications([]);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load application history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Track status updates for campus placement drives and company shortlists.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
            {applications.length} Submissions
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
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileCheck className="mx-auto h-10 w-10 text-[#A1A1A6]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">No Applications Submitted Yet</h3>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Visit the &quot;Campus Drives&quot; tab to explore open recruitment opportunities and apply.
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
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#F5F5F7]/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#1D1D1F] flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#0071E3]" />
                        {app.drive?.companyName || "Company"}
                      </td>
                      <td className="py-3.5 px-4 text-[#86868B]">
                        {app.drive?.jobRole || "Software Engineer"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                        {app.drive?.ctcPackage || "Confidential"}
                      </td>
                      <td className="py-3.5 px-4 text-[#86868B]">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
