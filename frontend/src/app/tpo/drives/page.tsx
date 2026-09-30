"use client";

import React, { useEffect, useState } from "react";
import { driveService } from "@/services/drive.service";
import { RecruitmentDrive } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  PlusCircle,
  Building2,
  MapPin,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Users,
} from "lucide-react";

const BRANCHES = ["CE", "AIML", "IT", "EC", "EE", "CIVIL", "CHEMICAL", "MECHANICAL"];

export default function TPODrivesPage() {
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Drive Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    jobRole: "",
    ctcPackage: "",
    location: "",
    minCpi: 6.0,
    deadline: "",
    description: "",
    eligibleBranches: ["CE", "AIML", "IT"] as string[],
  });

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
      setErrorMessage((err as Error)?.message || "Failed to fetch recruitment drives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleBranchToggle = (branch: string) => {
    setFormData((prev) => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter((b) => b !== branch)
        : [...prev.eligibleBranches, branch],
    }));
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await driveService.createDrive({
        companyName: formData.companyName,
        jobRole: formData.jobRole,
        ctcPackage: formData.ctcPackage,
        location: formData.location,
        minCpi: Number(formData.minCpi),
        deadline: formData.deadline,
        description: formData.description,
        eligibleBranches: formData.eligibleBranches as any,
      });
      setModalOpen(false);
      fetchDrives();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to create recruitment drive");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Placement Drives
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage company job postings, branch cutoffs, salary packages, and applicant deadlines.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          className="gap-2 font-semibold text-xs shadow-lg shadow-blue-500/20"
        >
          <PlusCircle className="h-4 w-4" /> Create New Drive
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drives Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading placement drives...
        </div>
      ) : drives.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center space-y-3">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Active Drives Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Create New Drive&quot; to add your first campus recruitment opportunity.
          </p>
          <Button
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="mt-2 text-xs font-semibold gap-2"
          >
            <PlusCircle className="h-4 w-4" /> Create Drive
          </Button>
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
                  <Badge variant={drive.status === "ACTIVE" ? "success" : "secondary"}>
                    {drive.status || "ACTIVE"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Package (CTC)</span>
                    <span className="font-bold text-slate-900">{drive.ctcPackage || "Confidential"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">Min CPI Cutoff</span>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Drive Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Post New Recruitment Drive</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Company Name</label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Tata Consultancy Services"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Job Role / Designation</label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Software Engineer Trainee"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">CTC Package</label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. 7.5 LPA"
                    value={formData.ctcPackage}
                    onChange={(e) => setFormData({ ...formData, ctcPackage: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Min CPI Cutoff</label>
                  <Input
                    required
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.minCpi}
                    onChange={(e) => setFormData({ ...formData, minCpi: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Application Deadline</label>
                  <Input
                    required
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Job Location</label>
                <Input
                  required
                  type="text"
                  placeholder="e.g. Gandhinagar / Ahmedabad / Remote"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700">Eligible Branches</label>
                <div className="flex flex-wrap gap-2">
                  {BRANCHES.map((b) => {
                    const isSelected = formData.eligibleBranches.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => handleBranchToggle(b)}
                        className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Publish Drive
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
