"use client";

import React, { useEffect, useState } from "react";
import { tpoService } from "@/services/tpo.service";
import { StudentProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const BRANCHES = [
  "ALL",
  "CE",
  "AIML",
  "IT",
  "EC",
  "EE",
  "CIVIL",
  "CHEMICAL",
  "MECHANICAL",
  "RUBBER",
  "PLASTIC",
  "ENVIRONMENTAL",
  "IC",
];

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
    } fontFinally: {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Profile Verification
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review academic marks, calculate CPI/CGPA, and verify or reject student profiles for campus placement eligibility.
          </p>
        </div>
        <a
          href={tpoService.exportStudentsUrl("csv")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV Data
        </a>
      </div>

      {/* Filter Bar */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by student name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="ALL">All Branches</option>
                {BRANCHES.filter((b) => b !== "ALL").map((b) => (
                  <option key={b} value={b}>
                    {b} Branch
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Table Card */}
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-medium text-slate-500">
              Loading student records...
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No Student Profiles Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No students match your selected filters. Try changing your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">CPI / CGPA</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {student.fullName || "Unspecified"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {student.user?.email || "N/A"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{student.branch || "—"}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {student.studentType || "REGULAR"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        {student.cpi ? Number(student.cpi).toFixed(2) : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        {student.verificationStatus === "VERIFIED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                          </span>
                        ) : student.verificationStatus === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 border border-red-200">
                            <XCircle className="h-3.5 w-3.5 text-red-600" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                            <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect Profile
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedStudent.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedStudent.user?.email} • Branch: {selectedStudent.branch || "Not Set"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Academic Marks Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">10th Percentage</p>
                  <p className="text-sm font-bold text-slate-900">{selectedStudent.tenthPercentage}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">Student Type</p>
                  <p className="text-sm font-bold text-slate-900">{selectedStudent.studentType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">CPI</p>
                  <p className="text-sm font-bold text-blue-600">
                    {selectedStudent.cpi ? Number(selectedStudent.cpi).toFixed(2) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">CGPA</p>
                  <p className="text-sm font-bold text-purple-600">
                    {selectedStudent.cgpa ? Number(selectedStudent.cgpa).toFixed(2) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for profile rejection (e.g. 10th marks discrepancy)..."
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-3 focus:bg-white focus:border-blue-600 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleVerify(selectedStudent.id, "REJECTED")}
                  disabled={isProcessing}
                  className="gap-2 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4" /> Reject Profile
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleVerify(selectedStudent.id, "VERIFIED")}
                  disabled={isProcessing}
                  className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
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
