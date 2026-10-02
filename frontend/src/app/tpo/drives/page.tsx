"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { driveService } from "@/services/drive.service";
import { RecruitmentDrive } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
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
  Mail,
  Download,
  FileSpreadsheet,
  UserCheck,
  Check,
  FileText,
  ExternalLink,
  ImageIcon,
  Loader2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Search,
  Power,
} from "lucide-react";

import { ENGINEERING_BRANCHES, BranchCode } from "@/config/constants";
import { tpoService } from "@/services/tpo.service";
import { uploadService } from "@/services/upload.service";

const ALL_BRANCHES: BranchCode[] = ENGINEERING_BRANCHES.map((b) => b.code);

function CompanyLogo({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50 shrink-0">
        <Building2 className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="logo-badge h-12 w-12 rounded-xl p-1 shrink-0 flex items-center justify-center bg-white shadow-xs border border-black/[0.06] dark:border-white/20">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain rounded-lg"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function TPODrivesPage() {
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drive action states
  const [notifyingDriveId, setNotifyingDriveId] = useState<string | null>(null);
  const [exportingDriveId, setExportingDriveId] = useState<string | null>(null);

  // Applicants & Attendance Modal State
  const [applicantsModalOpen, setApplicantsModalOpen] = useState(false);
  const [candidatesModalTab, setCandidatesModalTab] = useState<"applicants" | "eligible">("applicants");
  const [activeDriveForApplicants, setActiveDriveForApplicants] = useState<RecruitmentDrive | null>(null);
  const [driveApplicants, setDriveApplicants] = useState<any[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [loadingResumeId, setLoadingResumeId] = useState<string | null>(null);

  const handleViewResume = async (applicationId: string) => {
    try {
      setLoadingResumeId(applicationId);
      const blob = await apiClient.getBlob(`/applications/${applicationId}/resume`);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err: any) {
      alert(err.message || "Failed to load resume PDF");
    } finally {
      setLoadingResumeId(null);
    }
  };

  // New Drive Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyLogo: "",
    jobRole: "",
    minLpa: "",
    maxLpa: "",
    location: "",
    minCpi: "6.0",
    minTenthPercentage: "60.0",
    minTwelfthPercentage: "60.0",
    allowedStudentType: "ALL" as "ALL" | "REGULAR" | "D2D",
    deadline: "",
    description: "",
    brochureUrl: "",
    eligibleBranches: ALL_BRANCHES as BranchCode[],
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setLogoUploadError("Please select a valid image file (PNG, JPG, WEBP, or SVG).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError("Image size must be less than 5MB.");
      return;
    }

    try {
      setIsUploadingLogo(true);
      setLogoUploadError(null);
      const res = await uploadService.uploadImage(file, "placement_portal/companies");
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, companyLogo: res.data.url }));
      }
    } catch (err: unknown) {
      setLogoUploadError((err as Error)?.message || "Failed to upload company logo to Cloudinary");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [selectedTab, setSelectedTab] = useState<"ALL" | "ACTIVE" | "CLOSED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingDriveId, setTogglingDriveId] = useState<string | null>(null);

  const fetchDrives = async () => {
    try {
      setIsLoading(true);
      const res = await driveService.getDrives({
        limit: 100,
      });
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

  const handleToggleDriveStatus = async (drive: RecruitmentDrive) => {
    const nextStatus = drive.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      setTogglingDriveId(drive.id);
      await driveService.updateDrive(drive.id, { status: nextStatus });
      toast.success(`Drive status changed to ${nextStatus}`);
      fetchDrives();
    } catch (err: any) {
      toast.error(err.message || "Failed to update drive status");
    } finally {
      setTogglingDriveId(null);
    }
  };

  const handleNotifyDrive = async (driveId: string, target: "APPLICANTS" | "ELIGIBLE" = "APPLICANTS") => {
    try {
      setNotifyingDriveId(driveId);
      const res = await tpoService.notifyDriveApplicants(driveId, { target });
      toast.success(
        res.data?.message ||
          (target === "APPLICANTS"
            ? "Applicants notified via email!"
            : "Eligible students invited via email!")
      );
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to send notifications");
    } finally {
      setNotifyingDriveId(null);
    }
  };

  const handleExportDriveApplicants = async (driveId: string, format: "csv" | "xlsx") => {
    try {
      setExportingDriveId(`${driveId}-${format}`);
      await tpoService.exportDriveApplicants(driveId, format);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || `Failed to export applicants as ${format.toUpperCase()}`);
    } finally {
      setExportingDriveId(null);
    }
  };

  const handleOpenApplicants = async (drive: RecruitmentDrive) => {
    setActiveDriveForApplicants(drive);
    setApplicantsModalOpen(true);
    setCandidatesModalTab("applicants");
    setEligibleStudents([]);
    setEligibleSearch("");
    try {
      setLoadingApplicants(true);
      const res = await tpoService.getApplications({ driveId: drive.id, limit: 100 });
      if (res.data?.data) {
        setDriveApplicants(res.data.data);
      } else {
        setDriveApplicants([]);
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to load drive applicants");
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (
    applicationId: string,
    status: "APPLIED" | "SHORTLISTED" | "REJECTED" | "SELECTED"
  ) => {
    try {
      setStatusUpdatingId(applicationId);
      await tpoService.updateApplicationStatus(applicationId, status);
      // Refresh local list — if moved beyond APPLIED, default attendance is present
      setDriveApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status,
                isPresent: status !== "APPLIED" ? true : app.isPresent,
                attendanceMarked: status !== "APPLIED" ? true : app.attendanceMarked,
              }
            : app
        )
      );
      toast.success(`Application status updated to ${status}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update application status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleMarkAttendance = async (applicationId: string, isPresent: boolean) => {
    try {
      setStatusUpdatingId(applicationId);
      await tpoService.markAttendance(applicationId, isPresent);
      setDriveApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, attendanceMarked: true, isPresent }
            : app
        )
      );
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to mark attendance");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  // Lock background scrolling when any popup/modal is open
  useEffect(() => {
    if (modalOpen || applicantsModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalOpen, applicantsModalOpen]);

  const handleBranchToggle = (branch: BranchCode) => {
    setFormData((prev) => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter((b) => b !== branch)
        : [...prev.eligibleBranches, branch],
    }));
  };

  const handleSelectAllBranches = () => {
    setFormData((prev) => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.length === ALL_BRANCHES.length ? [] : ALL_BRANCHES,
    }));
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (!formData.companyName.trim()) {
        alert("Please enter a company name.");
        return;
      }
      if (!formData.jobRole.trim()) {
        alert("Please enter a job role.");
        return;
      }
      const minLpaVal = parseFloat(formData.minLpa);
      if (isNaN(minLpaVal) || minLpaVal <= 0) {
        alert("Please enter a valid Min LPA (e.g. 6.5).");
        return;
      }
      const maxLpaVal = formData.maxLpa.trim() ? parseFloat(formData.maxLpa) : null;
      if (maxLpaVal !== null && (isNaN(maxLpaVal) || maxLpaVal < minLpaVal)) {
        alert("Max LPA must be greater than or equal to Min LPA.");
        return;
      }

      await driveService.createDrive({
        companyName: formData.companyName.trim(),
        companyLogo: formData.companyLogo.trim() || undefined,
        role: formData.jobRole.trim(),
        ctc: minLpaVal,
        ctcMax: maxLpaVal ?? undefined,
        location: formData.location.trim() || undefined,
        minCpi: formData.minCpi.trim() ? parseFloat(formData.minCpi) : undefined,
        minTenthPercentage: formData.minTenthPercentage.trim() ? parseFloat(formData.minTenthPercentage) : undefined,
        minTwelfthPercentage: formData.minTwelfthPercentage.trim() ? parseFloat(formData.minTwelfthPercentage) : undefined,
        allowedStudentType: formData.allowedStudentType,
        applicationDeadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        description: formData.description.trim() || undefined,
        brochureUrl: formData.brochureUrl.trim() || undefined,
        allowedBranches: formData.eligibleBranches,
      });

      setModalOpen(false);
      // Reset form
      setFormData({
        companyName: "",
        companyLogo: "",
        jobRole: "",
        minLpa: "",
        maxLpa: "",
        location: "",
        minCpi: "6.0",
        minTenthPercentage: "60.0",
        minTwelfthPercentage: "60.0",
        allowedStudentType: "ALL",
        deadline: "",
        description: "",
        brochureUrl: "",
        eligibleBranches: ALL_BRANCHES,
      });
      setLogoUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDrives();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to create recruitment drive");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDrives = drives.filter((d) => d.status !== "CLOSED");
  const closedDrives = drives.filter((d) => d.status === "CLOSED");
  const totalApplications = drives.reduce(
    (sum, d) => sum + (d._count?.applications || 0),
    0
  );

  const tabDrives =
    selectedTab === "ACTIVE"
      ? activeDrives
      : selectedTab === "CLOSED"
      ? closedDrives
      : drives;

  const query = searchQuery.trim().toLowerCase();
  const filteredDrives = tabDrives.filter((d) => {
    if (!query) return true;
    const name = (d.company?.name || (d as any).companyName || "").toLowerCase();
    const role = (d.role || (d as any).jobRole || "").toLowerCase();
    return name.includes(query) || role.includes(query);
  });

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

      {/* 3 Top Stat Widgets: Active Drives, Closed Drives, Total Applications */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Widget 1: Active Drives */}
        <button
          type="button"
          onClick={() => setSelectedTab("ACTIVE")}
          className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
            selectedTab === "ACTIVE"
              ? "bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Drives
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                selectedTab === "ACTIVE" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {activeDrives.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Currently accepting student applications
            </p>
          </div>
          {selectedTab === "ACTIVE" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
          )}
        </button>

        {/* Widget 2: Past / Closed Drives */}
        <button
          type="button"
          onClick={() => setSelectedTab("CLOSED")}
          className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
            selectedTab === "CLOSED"
              ? "bg-slate-100 border-slate-500 shadow-md ring-2 ring-slate-400/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Past / Closed Drives
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                selectedTab === "CLOSED" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {closedDrives.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Concluded & archived recruitment drives
            </p>
          </div>
          {selectedTab === "CLOSED" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600" />
          )}
        </button>

        {/* Widget 3: Total Applications */}
        <button
          type="button"
          onClick={() => setSelectedTab("ALL")}
          className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
            selectedTab === "ALL"
              ? "bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                selectedTab === "ALL" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {totalApplications}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Received across all campus recruitment drives
            </p>
          </div>
          {selectedTab === "ALL" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
          )}
        </button>
      </div>

      {/* Segmented Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 min-w-max">
            <button
              type="button"
              onClick={() => setSelectedTab("ALL")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedTab === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({drives.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("ACTIVE")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedTab === "ACTIVE"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Active ({activeDrives.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("CLOSED")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedTab === "CLOSED"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Closed ({closedDrives.length})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
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
      ) : filteredDrives.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center space-y-3">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">
            {searchQuery ? "No matching drives found" : "No Drives in this Category"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search criteria."
              : "Click \"Create New Drive\" to add a campus recruitment opportunity."}
          </p>
          {!searchQuery && (
            <Button
              variant="primary"
              onClick={() => setModalOpen(true)}
              className="mt-2 text-xs font-semibold gap-2"
            >
              <PlusCircle className="h-4 w-4" /> Create Drive
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredDrives.map((drive) => {
            const companyTitle = drive.company?.name || (drive as any).companyName || "Unknown Company";
            const jobTitle = drive.role || (drive as any).jobRole || "Job Role";
            const ctcDisplay = drive.ctcMax
              ? `₹${drive.ctc} - ${drive.ctcMax} LPA`
              : drive.ctc
                ? `₹${drive.ctc} LPA`
                : (drive as any).ctcPackage || "Confidential";
            const deadlineDisplay = drive.applicationDeadline
              ? new Date(drive.applicationDeadline).toLocaleDateString()
              : drive.deadline
                ? new Date(drive.deadline).toLocaleDateString()
                : "Open";
            const branchesList = drive.allowedBranches || (drive as any).eligibleBranches || [];
            const companyLogo = drive.company?.imageUrl || (drive as any).companyLogo;
            const brochureMatch = (drive.description || "").match(/Brochure:\s*(https?:\/\/[^\s]+)/i);
            const brochureUrl = (drive as any).brochureUrl || (brochureMatch ? brochureMatch[1] : null);
            const applicantCount = drive._count?.applications ?? 0;

            return (
              <Card key={drive.id} className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <CompanyLogo src={companyLogo} alt={companyTitle} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {companyTitle}
                        </CardTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Users className="h-2.5 w-2.5" />
                            {applicantCount}
                          </span>
                          <Badge variant={drive.status === "ACTIVE" ? "success" : "secondary"} className="text-[9px] px-1.5">
                            {drive.status || "ACTIVE"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-blue-600 truncate">{jobTitle}</p>
                      {brochureUrl && (
                        <a
                          href={brochureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium underline mt-0.5"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" /> Brochure
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-1 text-xs">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Package (CTC)</span>
                      <span className="font-bold text-slate-900 truncate block">{ctcDisplay}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Min CPI Cutoff</span>
                      <span className="font-bold text-blue-600 truncate block">{drive.minCpi ? `${drive.minCpi} CPI` : "No Cutoff"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Job Location</span>
                      <span className="font-medium text-slate-700 truncate block">{drive.location || "On-site"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Deadline</span>
                      <span className="font-medium text-slate-700 truncate block">{deadlineDisplay}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Eligible Branches</span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {branchesList.length === 0 || branchesList.length === ALL_BRANCHES.length ? (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                          All Engineering Branches
                        </span>
                      ) : (
                        branchesList.map((b: string) => (
                          <span
                            key={b}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200"
                          >
                            {b}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>

                <div className="p-3 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotifyDrive(drive.id, applicantCount > 0 ? "APPLICANTS" : "ELIGIBLE")}
                      disabled={notifyingDriveId === drive.id}
                      className="h-7 text-[10px] sm:text-[11px] px-1.5 sm:px-2 gap-0.5 sm:gap-1 border-slate-200 text-blue-600 hover:bg-blue-50"
                      title={applicantCount > 0 ? `Send email to ${applicantCount} applicants` : "Invite eligible candidates"}
                    >
                      <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span className="truncate">{notifyingDriveId === drive.id
                        ? "..."
                        : applicantCount > 0
                        ? `Notify (${applicantCount})`
                        : "Invite"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportDriveApplicants(drive.id, "csv")}
                      disabled={exportingDriveId === `${drive.id}-csv`}
                      className="h-7 text-[10px] sm:text-[11px] px-1.5 sm:px-2 gap-0.5 border-slate-200 text-emerald-600 hover:bg-emerald-50"
                      title="Export applicants as CSV"
                    >
                      <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      CSV
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportDriveApplicants(drive.id, "xlsx")}
                      disabled={exportingDriveId === `${drive.id}-xlsx`}
                      className="h-7 text-[10px] sm:text-[11px] px-1.5 sm:px-2 gap-0.5 border-slate-200 text-blue-600 hover:bg-blue-50"
                      title="Export applicants as Excel"
                    >
                      <FileSpreadsheet className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      XLSX
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleDriveStatus(drive)}
                      disabled={togglingDriveId === drive.id}
                      className={`h-7 text-[10px] sm:text-[11px] px-1.5 sm:px-2 gap-0.5 border-slate-200 ${
                        drive.status === "ACTIVE"
                          ? "text-amber-700 hover:bg-amber-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                      title={drive.status === "ACTIVE" ? "Mark drive as CLOSED" : "Reopen drive as ACTIVE"}
                    >
                      <Power className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      {drive.status === "ACTIVE" ? "Close" : "Reopen"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenApplicants(drive)}
                      className="h-7 text-[10px] sm:text-[11px] px-2 gap-1 ml-auto"
                    >
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> Applicants
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Drive Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overscroll-contain">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Post New Recruitment Drive</h3>
                <p className="text-xs text-slate-500">Configure salary package range, branch cutoffs, and deadlines.</p>
              </div>
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
                  <label className="font-semibold text-slate-700">Company Name *</label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Google India / TCS / Infosys"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Job Role / Designation *</label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Associate Software Engineer"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  />
                </div>
              </div>

              {/* Company Logo and Brochure / Documentation Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Company Logo (Upload or Link)</label>
                    {formData.companyLogo && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Logo Attached
                      </span>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  {/* Upload button & URL input row */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 text-xs px-3 gap-1.5 shrink-0 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 text-blue-600" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </Button>

                      <Input
                        type="url"
                        placeholder="Or paste image URL (https://...)"
                        value={formData.companyLogo}
                        onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })}
                        className="h-9 flex-1 text-xs"
                      />
                    </div>

                    {logoUploadError && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {logoUploadError}
                      </p>
                    )}

                    {/* Logo Preview Card */}
                    {formData.companyLogo && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <img
                          src={formData.companyLogo}
                          alt="Company Logo Preview"
                          className="h-9 w-9 object-contain rounded-md bg-white border border-slate-200 p-0.5 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-800 truncate">
                            {formData.companyLogo}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            {formData.companyLogo.includes("cloudinary.com") ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Cloudinary Synced
                              </span>
                            ) : (
                              <span>External Link</span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, companyLogo: "" }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                          title="Remove logo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">Upload direct image file (synced to Cloudinary) or paste image URL</p>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Company Brochure / Job Description Link (Optional)</label>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/... or https://example.com/brochure.pdf"
                    value={formData.brochureUrl}
                    onChange={(e) => setFormData({ ...formData, brochureUrl: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-500">Public link to PDF, Drive folder, or recruitment brochure</p>
                </div>
              </div>

              {/* CTC Min & Max LPA Feature */}
              <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-blue-600" /> CTC Package Structure
                  </label>
                  <span className="text-[11px] font-semibold text-blue-700">
                    Preview:{" "}
                    {formData.minLpa
                      ? formData.maxLpa
                        ? `₹${formData.minLpa} - ${formData.maxLpa} LPA`
                        : `₹${formData.minLpa} LPA`
                      : "Enter LPA below"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Min LPA (or exact CTC) *</label>
                    <Input
                      required
                      type="number"
                      step="0.1"
                      min="0.5"
                      placeholder="e.g. 7.5"
                      value={formData.minLpa}
                      onChange={(e) => setFormData({ ...formData, minLpa: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-500">Minimum guaranteed package in Lakhs/annum</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Max LPA (Optional for range)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      placeholder="e.g. 12.0 (leave blank if fixed)"
                      value={formData.maxLpa}
                      onChange={(e) => setFormData({ ...formData, maxLpa: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-500">Max CTC for variable/performance bands</p>
                  </div>
                </div>
              </div>

              {/* Eligibility Cutoffs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Min CPI Cutoff</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="e.g. 6.5"
                    value={formData.minCpi}
                    onChange={(e) => setFormData({ ...formData, minCpi: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Min 10th % (Optional)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 60.0"
                    value={formData.minTenthPercentage}
                    onChange={(e) => setFormData({ ...formData, minTenthPercentage: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Min 12th % (Optional)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 60.0"
                    value={formData.minTwelfthPercentage}
                    onChange={(e) => setFormData({ ...formData, minTwelfthPercentage: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Allowed Student Type</label>
                  <select
                    value={formData.allowedStudentType}
                    onChange={(e) => setFormData({ ...formData, allowedStudentType: e.target.value as any })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All (Regular + D2D)</option>
                    <option value="REGULAR">Regular 12th Only</option>
                    <option value="D2D">D2D Diploma Only</option>
                  </select>
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
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Job Location</label>
                  <Input
                    type="text"
                    placeholder="e.g. Gandhinagar / Ahmedabad / Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Drive Description & Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Role responsibilities, bond details, tech stack..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Eligible Branches Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Eligible Branches ({formData.eligibleBranches.length}/{ALL_BRANCHES.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllBranches}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {formData.eligibleBranches.length === ALL_BRANCHES.length ? "Deselect All" : "Select All 14 Branches"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {ALL_BRANCHES.map((b) => {
                    const isSelected = formData.eligibleBranches.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => handleBranchToggle(b)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
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

      {/* Applicants & Eligible Students Modal */}
      {applicantsModalOpen && activeDriveForApplicants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overscroll-contain">
          <div className="w-full max-w-4xl max-h-[88vh] flex flex-col overscroll-contain bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {activeDriveForApplicants.company?.name || (activeDriveForApplicants as any).companyName}
                  </h3>
                  <Badge variant="default" className="text-[10px]">
                    {activeDriveForApplicants.role || (activeDriveForApplicants as any).jobRole}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  View applicants, eligible students, manage attendance &amp; selection status.
                </p>
              </div>
              <button
                onClick={() => setApplicantsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors self-start sm:self-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCandidatesModalTab("applicants")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    candidatesModalTab === "applicants"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Applicants ({driveApplicants.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCandidatesModalTab("eligible");
                    // Fetch eligible students on tab switch if not already loaded
                    if (eligibleStudents.length === 0 && !loadingEligible) {
                      (async () => {
                        try {
                          setLoadingEligible(true);
                          const res = await driveService.getEligibleStudents(activeDriveForApplicants.id);
                          if (res.data?.students) {
                            setEligibleStudents(res.data.students);
                          } else {
                            setEligibleStudents([]);
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Failed to load eligible students");
                        } finally {
                          setLoadingEligible(false);
                        }
                      })();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    candidatesModalTab === "eligible"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Eligible Students {eligibleStudents.length > 0 ? `(${eligibleStudents.length})` : ""}
                </button>
              </div>

              {/* Action buttons contextual to tab */}
              <div className="flex items-center gap-1.5 ml-auto">
                {candidatesModalTab === "applicants" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotifyDrive(activeDriveForApplicants.id, "APPLICANTS")}
                      disabled={notifyingDriveId === activeDriveForApplicants.id}
                      className="h-7 text-[11px] font-medium gap-1 text-blue-600 hover:bg-blue-50 border-slate-200"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {notifyingDriveId === activeDriveForApplicants.id ? "Sending..." : "Notify"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportDriveApplicants(activeDriveForApplicants.id, "csv")}
                      className="h-7 text-[11px] font-medium gap-1 text-emerald-600 hover:bg-emerald-50 border-slate-200"
                    >
                      <Download className="h-3.5 w-3.5" /> CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportDriveApplicants(activeDriveForApplicants.id, "xlsx")}
                      className="h-7 text-[11px] font-medium gap-1 text-blue-600 hover:bg-blue-50 border-slate-200"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await tpoService.exportDriveEligibleStudents(activeDriveForApplicants.id, "csv");
                          toast.success("Eligible students CSV downloaded");
                        } catch (err: any) {
                          toast.error(err.message || "Failed to export eligible students");
                        }
                      }}
                      className="h-7 text-[11px] font-medium gap-1 text-emerald-600 hover:bg-emerald-50 border-slate-200"
                    >
                      <Download className="h-3.5 w-3.5" /> CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await tpoService.exportDriveEligibleStudents(activeDriveForApplicants.id, "xlsx");
                          toast.success("Eligible students Excel downloaded");
                        } catch (err: any) {
                          toast.error(err.message || "Failed to export eligible students");
                        }
                      }}
                      className="h-7 text-[11px] font-medium gap-1 text-blue-600 hover:bg-blue-50 border-slate-200"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotifyDrive(activeDriveForApplicants.id, "ELIGIBLE")}
                      disabled={notifyingDriveId === activeDriveForApplicants.id}
                      className="h-7 text-[11px] font-medium gap-1 text-blue-600 hover:bg-blue-50 border-slate-200"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {notifyingDriveId === activeDriveForApplicants.id ? "Sending..." : "Invite All"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {candidatesModalTab === "applicants" ? (
                <>
                  {/* Policy Info Notice */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 mb-3 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Campus Policy:</span> Marking an unplaced student <strong>Absent</strong> debars them from participating in future drives. If a student is already placed (e.g. selected in one drive), absence in this drive is recorded without debarring their confirmed offer. Click &quot;Resume&quot; to review candidate credentials.
                    </div>
                  </div>

                  {loadingApplicants ? (
                    <div className="p-12 text-center text-xs text-slate-500 font-medium">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading applicants...
                    </div>
                  ) : driveApplicants.length === 0 ? (
                    <div className="py-16 px-6 text-center space-y-3">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-xs">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800">
                          No applications submitted for this drive yet
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Eligible candidates who apply to this recruitment drive will appear here for resume review, attendance tracking, and selection round management.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                            <th className="py-3 px-3">Candidate</th>
                            <th className="py-3 px-3">Branch / Type</th>
                            <th className="py-3 px-3">10th %</th>
                            <th className="py-3 px-3">Resume</th>
                            <th className="py-3 px-3">Attendance</th>
                            <th className="py-3 px-3">Selection Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {driveApplicants.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900">{app.student?.fullName || "Student"}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{app.student?.user?.email}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-medium">{app.student?.branch || "—"}</div>
                                <div className="text-[10px] text-slate-400">{app.student?.studentType || "REGULAR"}</div>
                              </td>
                              <td className="py-3 px-3 font-medium">
                                {app.student?.tenthPercentage ? `${app.student.tenthPercentage}%` : "—"}
                              </td>
                              <td className="py-3 px-3">
                                {app.id || app.resumeUrl || app.student?.resumeUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => handleViewResume(app.id)}
                                    disabled={loadingResumeId === app.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200 transition-colors disabled:opacity-50"
                                    title="Open applicant resume PDF"
                                  >
                                    {loadingResumeId === app.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <FileText className="h-3 w-3" />
                                    )}
                                    Resume
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">No Resume</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(app.id, true)}
                                    disabled={statusUpdatingId === app.id}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${app.attendanceMarked && app.isPresent
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                      }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(app.id, false)}
                                    disabled={statusUpdatingId === app.id}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${app.attendanceMarked && !app.isPresent
                                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                      }`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <select
                                  value={app.status}
                                  disabled={statusUpdatingId === app.id}
                                  onChange={(e) =>
                                    handleUpdateStatus(
                                      app.id,
                                      e.target.value as "APPLIED" | "SHORTLISTED" | "REJECTED" | "SELECTED"
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="APPLIED">APPLIED</option>
                                  <option value="SHORTLISTED">SHORTLISTED</option>
                                  <option value="SELECTED">SELECTED</option>
                                  <option value="REJECTED">REJECTED</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                /* ===== Eligible Students Tab ===== */
                <>
                  {/* Search bar for eligible students */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search eligible students by name, email or enrollment..."
                      value={eligibleSearch}
                      onChange={(e) => setEligibleSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {loadingEligible ? (
                    <div className="p-12 text-center text-xs text-slate-500 font-medium">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading eligible students...
                    </div>
                  ) : eligibleStudents.length === 0 ? (
                    <div className="py-16 px-6 text-center space-y-3">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shadow-xs">
                        <UserCheck className="h-8 w-8 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800">
                          No eligible students found for this drive
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          No students match the eligibility criteria (CPI cutoff, branch, 10th/12th percentage, student type) set for this drive.
                        </p>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const q = eligibleSearch.trim().toLowerCase();
                      const filtered = eligibleStudents.filter((s: any) => {
                        if (!q) return true;
                        const name = (s.fullName || "").toLowerCase();
                        const email = (s.user?.email || s.email || "").toLowerCase();
                        const enrollment = (s.enrollmentNumber || "").toLowerCase();
                        return name.includes(q) || email.includes(q) || enrollment.includes(q);
                      });
                      return (
                        <>
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 mb-3 text-[11px] text-emerald-900 flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>{eligibleStudents.length}</strong> students are eligible for this drive based on CPI, branch, and other criteria.
                              {q && ` Showing ${filtered.length} matching "${eligibleSearch}".`}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 bg-emerald-50/50 text-[11px] font-semibold text-slate-500">
                                  <th className="py-3 px-3">#</th>
                                  <th className="py-3 px-3">Student Name</th>
                                  <th className="py-3 px-3">Email</th>
                                  <th className="py-3 px-3">Enrollment</th>
                                  <th className="py-3 px-3">Branch</th>
                                  <th className="py-3 px-3">Type</th>
                                  <th className="py-3 px-3">CPI / CGPA</th>
                                  <th className="py-3 px-3">10th %</th>
                                  <th className="py-3 px-3">12th %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-800">
                                {filtered.map((s: any, idx: number) => (
                                  <tr key={s.id || idx} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.fullName || "—"}</td>
                                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{s.user?.email || s.email || "—"}</td>
                                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{s.enrollmentNumber || "—"}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                        {s.branch || "—"}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium">{s.studentType || "REGULAR"}</td>
                                    <td className="py-2.5 px-3 font-bold text-emerald-700">{s.cpi || s.cgpa || "—"}</td>
                                    <td className="py-2.5 px-3 font-medium">{s.tenthPercentage ? `${s.tenthPercentage}%` : "—"}</td>
                                    <td className="py-2.5 px-3 font-medium">{s.twelfthPercentage ? `${s.twelfthPercentage}%` : "—"}</td>
                                  </tr>
                                ))}
                                {filtered.length === 0 && (
                                  <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-400">
                                      No students match &quot;{eligibleSearch}&quot;
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()
                  )}
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApplicantsModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
