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
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleVerify = async (studentId: string, verifyStatus: "VERIFIED" | "REJECTED") => {
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
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20 font-medium px-3 py-1 rounded-full text-xs">
            {students.length} Registered Students
          </Badge>
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
                        {student.verificationStatus === "VERIFIED" ? (
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
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                  {selectedStudent.fullName}
                </h3>
                <p className="text-xs text-[#86868B]">
                  {selectedStudent.user?.email} • Branch: {selectedStudent.branch || "Not Set"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Academic Marks Overview */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                Academic Performance
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F5F7]/80 p-4 rounded-2xl border border-black/[0.04]">
                <div>
                  <p className="text-[10px] font-medium text-[#86868B]">10th Percentage</p>
                  <p className="text-base font-semibold text-[#1D1D1F]">{selectedStudent.tenthPercentage}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#86868B]">Student Type</p>
                  <p className="text-base font-semibold text-[#1D1D1F]">{selectedStudent.studentType}</p>
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
            {selectedStudent.tenthMarks && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                  10th Standard Marks (Total: 600)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#F5F5F7]/50 p-3 rounded-2xl border border-black/[0.04] text-center text-xs">
                  <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                    <span className="block text-[10px] text-[#86868B]">Maths</span>
                    <span className="font-semibold">{selectedStudent.tenthMarks.maths}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                    <span className="block text-[10px] text-[#86868B]">Science</span>
                    <span className="font-semibold">{selectedStudent.tenthMarks.science}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                    <span className="block text-[10px] text-[#86868B]">English</span>
                    <span className="font-semibold">{selectedStudent.tenthMarks.english}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                    <span className="block text-[10px] text-[#86868B]">Social Sci</span>
                    <span className="font-semibold">{selectedStudent.tenthMarks.socialScience}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                    <span className="block text-[10px] text-[#86868B]">Sanskrit</span>
                    <span className="font-semibold">{selectedStudent.tenthMarks.sanskrit}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-black/[0.04]">
                    <span className="block text-[10px] text-[#0071E3] font-medium">Gujarati</span>
                    <span className="font-semibold text-[#0071E3]">{selectedStudent.tenthMarks.gujarati}</span>
                  </div>
                </div>
              </div>
            )}

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

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleVerify(selectedStudent.id, "REJECTED")}
                  disabled={isProcessing}
                  className="gap-2 text-xs font-medium text-[#FF3B30] border-black/[0.1] hover:bg-red-50"
                >
                  <X className="h-4 w-4" /> Reject Profile
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleVerify(selectedStudent.id, "VERIFIED")}
                  disabled={isProcessing}
                  className="gap-2 text-xs font-medium bg-[#34C759] hover:bg-[#28A745]"
                >
                  <Check className="h-4 w-4" /> Approve & Verify
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
