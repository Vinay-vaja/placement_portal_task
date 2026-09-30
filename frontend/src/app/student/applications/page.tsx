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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Application History & Status Tracker
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Track your active campus placement applications, shortlists, and offer selections.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              Loading application history...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileCheck className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-800">No Applications Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Visit the &quot;Campus Drives&quot; tab to explore open recruitment opportunities and apply.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Company Name</th>
                    <th className="py-3.5 px-4">Job Role</th>
                    <th className="py-3.5 px-4">CTC Package</th>
                    <th className="py-3.5 px-4">Application Date</th>
                    <th className="py-3.5 px-4">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        {app.drive?.companyName || "Company"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {app.drive?.jobRole || "Software Engineer"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {app.drive?.ctcPackage || "Confidential"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Recently"}
                      </td>
                      <td className="py-3.5 px-4">
                        {app.status === "SELECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <Award className="h-3.5 w-3.5 text-emerald-600" /> Selected / Offer Offered
                          </span>
                        ) : app.status === "SHORTLISTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Shortlisted for Interview
                          </span>
                        ) : app.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 border border-red-200">
                            <XCircle className="h-3.5 w-3.5 text-red-600" /> Not Shortlisted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                            <Clock className="h-3.5 w-3.5 text-amber-600" /> Application Under Review
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
