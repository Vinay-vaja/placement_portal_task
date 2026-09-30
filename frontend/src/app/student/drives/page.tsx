"use client";

import React, { useEffect, useState } from "react";
import { driveService } from "@/services/drive.service";
import { RecruitmentDrive } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  IndianRupee,
  Send,
  Award,
} from "lucide-react";

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);

  const fetchDrives = async () => {
    try {
      setIsLoading(true);
      const res = await driveService.getDrives();
      if (res.data?.data) {
        setDrives(res.data.data);
      } else {
        setDrives([]);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load active placement drives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleApply = async (driveId: string) => {
    try {
      setApplyingDriveId(driveId);
      const formData = new FormData();
      await driveService.applyToDrive(driveId, formData);
      alert("Application submitted successfully!");
      fetchDrives();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to submit application. Make sure your profile is verified.");
    } finally {
      setApplyingDriveId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Campus Recruitment Drives
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Explore open placement opportunities, check your branch/CPI eligibility, and submit applications.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drives List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-medium text-slate-500">
          Loading campus recruitment drives...
        </div>
      ) : drives.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center space-y-3">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Open Drives Currently</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Check back later as new companies are added by the Central TPO team.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => (
            <Card key={drive.id} className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {drive.companyName}
                      </CardTitle>
                      <p className="text-xs font-semibold text-blue-600">{drive.jobRole}</p>
                    </div>
                  </div>
                  <Badge variant="success">OPEN</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Package (CTC)</span>
                    <span className="font-bold text-slate-900">{drive.ctcPackage || "Best in Industry"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Min CPI Required</span>
                    <span className="font-bold text-blue-600">{drive.minCpi} CPI</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Job Location</span>
                    <span className="font-medium text-slate-700 truncate block">{drive.location || "On-site"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Deadline</span>
                    <span className="font-medium text-slate-700 block">
                      {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : "Open"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Eligible Branches</span>
                  <div className="flex flex-wrap gap-1">
                    {drive.eligibleBranches?.map((b) => (
                      <span
                        key={b}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => handleApply(drive.id)}
                  isLoading={applyingDriveId === drive.id}
                  className="w-full font-semibold text-xs shadow-md shadow-blue-500/20 gap-2 mt-2"
                >
                  <Send className="h-3.5 w-3.5" /> Apply for Placement
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
