"use client";

import React, { useEffect, useState } from "react";
import { tpoService } from "@/services/tpo.service";
import { StudentProfile } from "@/types";
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
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  GraduationCap,
  FileText,
  Clock,
  Download,
  Pencil,
  Lock,
  Save,
  RotateCcw,
  Info,
} from "lucide-react";

export default function TPOStudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // Selected student for detailed modal
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // TPO Student Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    dob: "",
    branch: "",
    studentType: "REGULAR" as "REGULAR" | "D2D",

    // 10th Marks
    mathsMarks: "",
    scienceMarks: "",
    englishMarks: "",
    socialScienceMarks: "",
    sanskritMarks: "",
    gujaratiMarks: "",

    // 12th Marks
    twelfthEnglishMarks: "",
    twelfthPhysicsMarks: "",
    twelfthMathsMarks: "",
    twelfthChemistryMarks: "",
    twelfthComputerMarks: "",

    // D2D Fields
    d2dCgpa: "",
    d2dCollege: "",
    d2dDetails: "",
    d2dAcpcRank: "",

    // SPIs (Sem 1 to 8)
    spis: Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, spi: "" })),
  });

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await tpoService.getStudents({
        search: search || undefined,
        branch: branch !== "ALL" ? branch : undefined,
        verificationStatus: status !== "ALL" ? (status as any) : undefined,
      });
      if (res.data?.data) {
        setStudents(res.data.data);
      } else {
        setStudents([]);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to load student profiles.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [branch, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      if (format === "csv") setIsExportingCsv(true);
      else setIsExportingXlsx(true);
      await tpoService.exportStudents(format, {
        search: search || undefined,
        branch: branch !== "ALL" ? branch : undefined,
        verificationStatus: status !== "ALL" ? status : undefined,
      });
    } catch (err: unknown) {
      alert((err as Error)?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      if (format === "csv") setIsExportingCsv(false);
      else setIsExportingXlsx(false);
    }
  };

  const handleVerify = async (studentId: string, verifyStatus: "PENDING" | "VERIFIED" | "REJECTED") => {
    try {
      setIsProcessing(true);
      await tpoService.verifyStudent(
        studentId,
        verifyStatus,
        verifyStatus === "REJECTED" ? rejectionReason : undefined
      );
      setSelectedStudent(null);
      setRejectionReason("");
      fetchStudents();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to update student verification status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async (studentId: string) => {
    try {
      setIsProcessing(true);
      await tpoService.dismissStudent(studentId, dismissReason || "Dismissed by Central TPO");
      setSelectedStudent(null);
      setDismissReason("");
      fetchStudents();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to dismiss student");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReinstate = async (studentId: string) => {
    try {
      setIsProcessing(true);
      await tpoService.reinstateStudent(studentId);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to reinstate student");
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditing = (student: StudentProfile) => {
    let formattedDob = student.dob || "";
    if (formattedDob.includes("T")) {
      formattedDob = formattedDob.split("T")[0];
    }

    const spisList = Array.from({ length: 8 }, (_, i) => {
      const sem = i + 1;
      const existing = student.semesterSpis?.find((s) => s.semester === sem);
      return {
        semester: sem,
        spi: existing?.spi !== undefined && existing?.spi !== null ? String(existing.spi) : "",
      };
    });

    setEditForm({
      fullName: student.fullName || "",
      phone: student.phone || "",
      dob: formattedDob,
      branch: student.branch || "",
      studentType: (student.studentType as "REGULAR" | "D2D") || "REGULAR",

      mathsMarks: student.mathsMarks !== undefined && student.mathsMarks !== null ? String(student.mathsMarks) : "",
      scienceMarks: student.scienceMarks !== undefined && student.scienceMarks !== null ? String(student.scienceMarks) : "",
      englishMarks: student.englishMarks !== undefined && student.englishMarks !== null ? String(student.englishMarks) : "",
      socialScienceMarks: student.socialScienceMarks !== undefined && student.socialScienceMarks !== null ? String(student.socialScienceMarks) : "",
      sanskritMarks: student.sanskritMarks !== undefined && student.sanskritMarks !== null ? String(student.sanskritMarks) : "",
      gujaratiMarks: student.gujaratiMarks !== undefined && student.gujaratiMarks !== null ? String(student.gujaratiMarks) : "",

      twelfthEnglishMarks: student.twelfthEnglishMarks !== undefined && student.twelfthEnglishMarks !== null ? String(student.twelfthEnglishMarks) : "",
      twelfthPhysicsMarks: student.twelfthPhysicsMarks !== undefined && student.twelfthPhysicsMarks !== null ? String(student.twelfthPhysicsMarks) : "",
      twelfthMathsMarks: student.twelfthMathsMarks !== undefined && student.twelfthMathsMarks !== null ? String(student.twelfthMathsMarks) : "",
      twelfthChemistryMarks: student.twelfthChemistryMarks !== undefined && student.twelfthChemistryMarks !== null ? String(student.twelfthChemistryMarks) : "",
      twelfthComputerMarks: student.twelfthComputerMarks !== undefined && student.twelfthComputerMarks !== null ? String(student.twelfthComputerMarks) : "",

      d2dCgpa: student.d2dCgpa !== undefined && student.d2dCgpa !== null ? String(student.d2dCgpa) : "",
      d2dCollege: student.d2dCollege || "",
      d2dDetails: student.d2dDetails || "",
      d2dAcpcRank: student.d2dAcpcRank !== undefined && student.d2dAcpcRank !== null ? String(student.d2dAcpcRank) : "",

      spis: spisList,
    });

    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    try {
      setIsSaving(true);
      setEditError(null);

      const payload: Record<string, any> = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        dob: editForm.dob,
        branch: editForm.branch,
        studentType: editForm.studentType,

        mathsMarks: editForm.mathsMarks !== "" ? Number(editForm.mathsMarks) : null,
        scienceMarks: editForm.scienceMarks !== "" ? Number(editForm.scienceMarks) : null,
        englishMarks: editForm.englishMarks !== "" ? Number(editForm.englishMarks) : null,
        socialScienceMarks: editForm.socialScienceMarks !== "" ? Number(editForm.socialScienceMarks) : null,
        sanskritMarks: editForm.sanskritMarks !== "" ? Number(editForm.sanskritMarks) : null,
        gujaratiMarks: editForm.gujaratiMarks !== "" ? Number(editForm.gujaratiMarks) : null,
      };

      if (editForm.studentType === "REGULAR") {
        payload.twelfthEnglishMarks = editForm.twelfthEnglishMarks !== "" ? Number(editForm.twelfthEnglishMarks) : null;
        payload.twelfthPhysicsMarks = editForm.twelfthPhysicsMarks !== "" ? Number(editForm.twelfthPhysicsMarks) : null;
        payload.twelfthMathsMarks = editForm.twelfthMathsMarks !== "" ? Number(editForm.twelfthMathsMarks) : null;
        payload.twelfthChemistryMarks = editForm.twelfthChemistryMarks !== "" ? Number(editForm.twelfthChemistryMarks) : null;
        payload.twelfthComputerMarks = editForm.twelfthComputerMarks !== "" ? Number(editForm.twelfthComputerMarks) : null;
      } else {
        payload.d2dCgpa = editForm.d2dCgpa !== "" ? Number(editForm.d2dCgpa) : null;
        payload.d2dCollege = editForm.d2dCollege.trim();
        payload.d2dDetails = editForm.d2dDetails.trim();
        payload.d2dAcpcRank = editForm.d2dAcpcRank !== "" ? Number(editForm.d2dAcpcRank) : null;
      }

      const validSpis = editForm.spis
        .filter((item) => item.spi !== "" && !isNaN(Number(item.spi)))
        .map((item) => ({ semester: Number(item.semester), spi: Number(item.spi) }));

      payload.spis = validSpis;

      const res = await tpoService.updateStudent(selectedStudent.id, payload);
      if (res.data) {
        setSelectedStudent(res.data);
      }
      setIsEditing(false);
      fetchStudents();
    } catch (err: unknown) {
      setEditError((err as Error)?.message || "Failed to save student profile edits.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Student Verification & Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B]">
            Inspect submitted academic records, 10th Gujarati/Sanskrit marks, CPIs, and verify student eligibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20 font-medium px-3 py-1.5 rounded-full text-xs">
            {students.length} Registered
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={isExportingCsv}
            className="gap-1.5 text-xs font-medium h-9 border-black/[0.12] hover:bg-neutral-50"
          >
            <Download className="h-4 w-4 text-[#34C759]" />
            {isExportingCsv ? "Exporting..." : "Export CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
            disabled={isExportingXlsx}
            className="gap-1.5 text-xs font-medium h-9 border-black/[0.12] hover:bg-neutral-50"
          >
            <Download className="h-4 w-4 text-[#0071E3]" />
            {isExportingXlsx ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-4 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
            <Input
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs sm:text-sm text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all"
            >
              <option value="ALL">All Engineering Branches</option>
              {ENGINEERING_BRANCHES.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} ({b.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs sm:text-sm text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Verified & Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </form>
      </Card>

      {/* Students Data Table */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-xs text-[#86868B]">
              Loading student records...
            </div>
          ) : students.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-xs text-[#86868B] space-y-2">
              <Users className="h-8 w-8 text-[#A1A1A6]" />
              <p>No student profiles matching the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-[#F5F5F7]/60 text-[11px] font-medium text-[#86868B]">
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">10th %</th>
                    <th className="py-3.5 px-4">CPI</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] text-xs text-[#1D1D1F]">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-[#F5F5F7]/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#1D1D1F]">
                        {student.fullName || "Unspecified"}
                      </td>
                      <td className="py-3.5 px-4 text-[#86868B] font-mono text-[11px]">
                        {student.user?.email || "N/A"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#1D1D1F]">{student.branch || "—"}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.06]">
                          {student.studentType || "REGULAR"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1D1D1F]">
                        {student.tenthPercentage !== undefined ? `${student.tenthPercentage}%` : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0071E3]">
                        {student.cpi ? Number(student.cpi).toFixed(2) : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        {student.isDismissed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" /> Dismissed
                          </span>
                        ) : student.verificationStatus === "VERIFIED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#34C759]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#28A745] border border-[#34C759]/20">
                            <CheckCircle2 className="h-3 w-3 text-[#28A745]" /> Verified
                          </span>
                        ) : student.verificationStatus === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF3B30]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                            <XCircle className="h-3 w-3 text-[#FF3B30]" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D97706] border border-[#FF9500]/20">
                            <Clock className="h-3 w-3 text-[#D97706]" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          className="gap-1.5 text-xs text-[#0071E3] border-black/[0.1] hover:bg-[#0071E3]/5"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-black/[0.08] p-6 space-y-6">
            {!isEditing ? (
              <>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                        {selectedStudent.fullName}
                      </h3>
                      {selectedStudent.verificationStatus === "VERIFIED" ? (
                        <Badge className="bg-[#34C759]/10 text-[#28A745] border border-[#34C759]/20 text-[10px] font-semibold">
                          VERIFIED
                        </Badge>
                      ) : selectedStudent.verificationStatus === "REJECTED" ? (
                        <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-semibold">
                          REJECTED
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          PENDING
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#86868B] mt-1">
                      {selectedStudent.user?.email} • Branch: {selectedStudent.branch || "Not Set"} • Phone: {selectedStudent.phone || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(selectedStudent)}
                      className="gap-1.5 text-xs text-[#0071E3] border-[#0071E3]/30 hover:bg-[#0071E3]/5 h-8 font-medium"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Student
                    </Button>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Academic Marks Overview */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                    Academic Performance Overview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F5F7]/80 p-4 rounded-2xl border border-black/[0.04]">
                    <div>
                      <p className="text-[10px] font-medium text-[#86868B]">10th Percentage</p>
                      <p className="text-base font-semibold text-[#1D1D1F]">{selectedStudent.tenthPercentage ?? 0}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#86868B]">
                        {selectedStudent.studentType === "REGULAR" ? "12th Percentage" : "D2D CGPA"}
                      </p>
                      <p className="text-base font-semibold text-[#1D1D1F]">
                        {selectedStudent.studentType === "REGULAR"
                          ? (selectedStudent.twelfthPercentage ? `${selectedStudent.twelfthPercentage}%` : "—")
                          : (selectedStudent.d2dCgpa ? `${selectedStudent.d2dCgpa}` : "—")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#86868B]">Computed CPI</p>
                      <p className="text-base font-semibold text-[#0071E3]">
                        {selectedStudent.cpi ? Number(selectedStudent.cpi).toFixed(2) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#86868B]">Computed CGPA</p>
                      <p className="text-base font-semibold text-purple-600">
                        {selectedStudent.cgpa ? Number(selectedStudent.cgpa).toFixed(2) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 10th Marks Breakdown Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                    10th Standard Marks Breakdown (Total: 600)
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#F5F5F7]/50 p-3 rounded-2xl border border-black/[0.04] text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                      <span className="block text-[10px] text-[#86868B]">Maths</span>
                      <span className="font-semibold">{selectedStudent.mathsMarks ?? "—"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                      <span className="block text-[10px] text-[#86868B]">Science</span>
                      <span className="font-semibold">{selectedStudent.scienceMarks ?? "—"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                      <span className="block text-[10px] text-[#86868B]">English</span>
                      <span className="font-semibold">{selectedStudent.englishMarks ?? "—"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                      <span className="block text-[10px] text-[#86868B]">Social Sci</span>
                      <span className="font-semibold">{selectedStudent.socialScienceMarks ?? "—"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                      <span className="block text-[10px] text-[#86868B]">Sanskrit</span>
                      <span className="font-semibold">{selectedStudent.sanskritMarks ?? "—"}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                      <span className="block text-[10px] text-[#0071E3] font-medium">Gujarati</span>
                      <span className="font-semibold text-[#0071E3]">{selectedStudent.gujaratiMarks ?? "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 12th Marks Breakdown (REGULAR) */}
                {selectedStudent.studentType === "REGULAR" && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      12th Standard Marks Breakdown (Science Stream)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#F5F5F7]/50 p-3 rounded-2xl border border-black/[0.04] text-center text-xs">
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">English</span>
                        <span className="font-semibold">{selectedStudent.twelfthEnglishMarks ?? "—"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">Physics</span>
                        <span className="font-semibold">{selectedStudent.twelfthPhysicsMarks ?? "—"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">Mathematics</span>
                        <span className="font-semibold">{selectedStudent.twelfthMathsMarks ?? "—"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">Chemistry</span>
                        <span className="font-semibold">{selectedStudent.twelfthChemistryMarks ?? "—"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">Computer</span>
                        <span className="font-semibold">{selectedStudent.twelfthComputerMarks ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* D2D Details (D2D) */}
                {selectedStudent.studentType === "D2D" && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Diploma to Degree (D2D) Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F5F5F7]/50 p-3 rounded-2xl border border-black/[0.04] text-xs">
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">Diploma CGPA</span>
                        <span className="font-semibold">{selectedStudent.d2dCgpa ?? "—"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">College</span>
                        <span className="font-semibold">{selectedStudent.d2dCollege ?? "—"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                        <span className="block text-[10px] text-[#86868B]">ACPC Merit Rank</span>
                        <span className="font-semibold">{selectedStudent.d2dAcpcRank ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Semester SPIs */}
                {selectedStudent.semesterSpis && selectedStudent.semesterSpis.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Engineering Semester SPIs
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#F5F5F7]/50 p-3 rounded-2xl border border-black/[0.04] text-center text-xs">
                      {selectedStudent.semesterSpis.map((spiRecord) => (
                        <div key={spiRecord.semester} className="p-2 rounded-xl bg-white border border-black/[0.04]">
                          <span className="block text-[10px] text-[#86868B]">Sem {spiRecord.semester}</span>
                          <span className="font-semibold text-[#0071E3]">{Number(spiRecord.spi).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Placement Eligibility & Disciplinary Status */}
                <div className="p-4 rounded-2xl bg-[#F5F5F7]/80 border border-black/[0.06] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-[#1D1D1F]">Placement Eligibility Status</h4>
                        {selectedStudent.isDismissed ? (
                          <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px]">
                            DISMISSED
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                            ELIGIBLE
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[#86868B]">
                        {selectedStudent.isDismissed
                          ? `Reason: ${selectedStudent.dismissalReason || "Dismissed by TPO cell"}`
                          : "Student is actively eligible to view and apply for placement drives."}
                      </p>
                    </div>

                    {selectedStudent.isDismissed ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleReinstate(selectedStudent.id)}
                        disabled={isProcessing}
                        className="text-xs font-medium text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      >
                        Reinstate Student
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Reason for dismissal..."
                          value={dismissReason}
                          onChange={(e) => setDismissReason(e.target.value)}
                          className="text-xs h-8 max-w-[200px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismiss(selectedStudent.id)}
                          disabled={isProcessing}
                          className="text-xs font-medium text-[#FF3B30] border-red-300 hover:bg-red-50"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="space-y-3 pt-4 border-t border-black/[0.06]">
                  <label className="text-xs font-medium text-[#1D1D1F]">
                    Rejection Remarks (Required if rejecting profile)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specify reason for profile rejection (e.g. 10th Gujarati marks discrepancy)..."
                    rows={2}
                    className="w-full text-xs rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 p-3 focus:bg-white focus:border-[#0071E3] focus:outline-none transition-all"
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleVerify(selectedStudent.id, "PENDING")}
                      disabled={isProcessing}
                      className="gap-1.5 text-xs font-medium text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      <AlertCircle className="h-3.5 w-3.5" /> Mark as Pending
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleVerify(selectedStudent.id, "REJECTED")}
                      disabled={isProcessing}
                      className="gap-1.5 text-xs font-medium text-[#FF3B30] border-red-300 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" /> Reject Profile
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleVerify(selectedStudent.id, "VERIFIED")}
                      disabled={isProcessing}
                      className="gap-1.5 text-xs font-medium bg-[#34C759] hover:bg-[#28A745] text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve & Verify
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* TPO Edit Student Form View */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                        Edit Student Record
                      </h3>
                      <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold gap-1">
                        <Lock className="h-3 w-3 text-amber-600" /> LOCKED PROFILE (PRESERVED)
                      </Badge>
                    </div>
                    <p className="text-xs text-[#86868B] mt-1">
                      Central TPO administrative edit mode. Profile lock status (<code className="text-[#0071E3]">profileLocked: true</code>) is preserved.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Info Box: Read-Only Derived Fields Notice */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/15 text-xs text-[#1D1D1F]">
                  <Info className="h-4 w-4 text-[#0071E3] flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#0071E3]">Derived Metrics are System-Controlled</p>
                    <p className="text-[#86868B] text-[11px]">
                      10th %, 12th %, CPI, CGPA, profileLocked, and placement eligibility cannot be manually overridden. Saving updated subject marks or SPIs automatically updates these values.
                    </p>
                  </div>
                </div>

                {editError && (
                  <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6">
                  {/* Section 1: Personal Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      1. Personal Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[#1D1D1F] block mb-1">Full Name</label>
                        <Input
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          placeholder="Student Full Name"
                          className="text-xs h-9"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#1D1D1F] block mb-1">Phone Number</label>
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="Phone Number"
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#1D1D1F] block mb-1">Date of Birth</label>
                        <Input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#1D1D1F] block mb-1">Engineering Branch</label>
                        <select
                          value={editForm.branch}
                          onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                          className="w-full h-9 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
                        >
                          <option value="">Select Branch</option>
                          {ENGINEERING_BRANCHES.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.code} ({b.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-[#1D1D1F] block mb-1">Student Type</label>
                        <select
                          value={editForm.studentType}
                          onChange={(e) => setEditForm({ ...editForm, studentType: e.target.value as "REGULAR" | "D2D" })}
                          className="w-full h-9 rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3 text-xs text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
                        >
                          <option value="REGULAR">REGULAR (10th + 12th + Engineering)</option>
                          <option value="D2D">D2D (Diploma to Degree)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 10th Standard Marks */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                        2. 10th Standard Subject Marks (out of 100)
                      </h4>
                      <span className="text-[11px] text-[#0071E3] font-medium">
                        10th % is computed automatically
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[#86868B] block mb-1">Maths</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.mathsMarks}
                          onChange={(e) => setEditForm({ ...editForm, mathsMarks: e.target.value })}
                          placeholder="0-100"
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#86868B] block mb-1">Science</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.scienceMarks}
                          onChange={(e) => setEditForm({ ...editForm, scienceMarks: e.target.value })}
                          placeholder="0-100"
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#86868B] block mb-1">English</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.englishMarks}
                          onChange={(e) => setEditForm({ ...editForm, englishMarks: e.target.value })}
                          placeholder="0-100"
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#86868B] block mb-1">Social Science</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.socialScienceMarks}
                          onChange={(e) => setEditForm({ ...editForm, socialScienceMarks: e.target.value })}
                          placeholder="0-100"
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#86868B] block mb-1">Sanskrit</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.sanskritMarks}
                          onChange={(e) => setEditForm({ ...editForm, sanskritMarks: e.target.value })}
                          placeholder="0-100"
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#0071E3] block mb-1">Gujarati</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.gujaratiMarks}
                          onChange={(e) => setEditForm({ ...editForm, gujaratiMarks: e.target.value })}
                          placeholder="0-100"
                          className="text-xs h-9 border-[#0071E3]/40 focus:border-[#0071E3]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 12th Marks (REGULAR) */}
                  {editForm.studentType === "REGULAR" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                          3. 12th Standard Subject Marks (Science Stream)
                        </h4>
                        <span className="text-[11px] text-[#0071E3] font-medium">
                          12th % is computed automatically
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">English</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.twelfthEnglishMarks}
                            onChange={(e) => setEditForm({ ...editForm, twelfthEnglishMarks: e.target.value })}
                            placeholder="0-100"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">Physics</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.twelfthPhysicsMarks}
                            onChange={(e) => setEditForm({ ...editForm, twelfthPhysicsMarks: e.target.value })}
                            placeholder="0-100"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">Mathematics</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.twelfthMathsMarks}
                            onChange={(e) => setEditForm({ ...editForm, twelfthMathsMarks: e.target.value })}
                            placeholder="0-100"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">Chemistry</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.twelfthChemistryMarks}
                            onChange={(e) => setEditForm({ ...editForm, twelfthChemistryMarks: e.target.value })}
                            placeholder="0-100"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">Computer</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.twelfthComputerMarks}
                            onChange={(e) => setEditForm({ ...editForm, twelfthComputerMarks: e.target.value })}
                            placeholder="0-100"
                            className="text-xs h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 4: D2D Data (D2D) */}
                  {editForm.studentType === "D2D" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                        3. Diploma to Degree (D2D) Data
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">Diploma CGPA</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={editForm.d2dCgpa}
                            onChange={(e) => setEditForm({ ...editForm, d2dCgpa: e.target.value })}
                            placeholder="e.g. 8.50"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">Diploma College</label>
                          <Input
                            value={editForm.d2dCollege}
                            onChange={(e) => setEditForm({ ...editForm, d2dCollege: e.target.value })}
                            placeholder="Polytechnic College Name"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">D2D Details / Specialization</label>
                          <Input
                            value={editForm.d2dDetails}
                            onChange={(e) => setEditForm({ ...editForm, d2dDetails: e.target.value })}
                            placeholder="Diploma Branch details"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#86868B] block mb-1">ACPC Merit Rank</label>
                          <Input
                            type="number"
                            value={editForm.d2dAcpcRank}
                            onChange={(e) => setEditForm({ ...editForm, d2dAcpcRank: e.target.value })}
                            placeholder="Merit Rank"
                            className="text-xs h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 5: Semester SPIs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                        4. Engineering Semester SPIs (Semesters 1 – 8)
                      </h4>
                      <span className="text-[11px] text-[#0071E3] font-medium">
                        CPI & CGPA recomputed on save
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F5F7]/60 p-3.5 rounded-2xl border border-black/[0.04]">
                      {editForm.spis.map((item, idx) => (
                        <div key={item.semester}>
                          <label className="text-[10px] font-medium text-[#86868B] block mb-1">
                            Semester {item.semester} SPI
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={item.spi}
                            onChange={(e) => {
                              const newSpis = [...editForm.spis];
                              newSpis[idx] = { ...newSpis[idx], spi: e.target.value };
                              setEditForm({ ...editForm, spis: newSpis });
                            }}
                            placeholder="0.00 - 10.00"
                            className="text-xs h-8 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.06]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="text-xs font-medium border-black/[0.12] hover:bg-neutral-50 h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="gap-1.5 text-xs font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white h-9 px-4"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSaving ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
