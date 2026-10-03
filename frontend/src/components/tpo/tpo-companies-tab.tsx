"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TpoAnalytics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Download,
  FileSpreadsheet,
  Users,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Award,
} from "lucide-react";

interface TPOCompaniesTabProps {
  stats: TpoAnalytics | null;
  onExportCompanyWise: (companyId?: string) => void;
  isExportingCompanyXlsx?: boolean;
}

export function TPOCompaniesTab({
  stats,
  onExportCompanyWise,
  isExportingCompanyXlsx = false,
}: TPOCompaniesTabProps) {
  const [search, setSearch] = useState("");
  const companyWise = stats?.packages?.companyWise || [];

  const filteredCompanies = companyWise.filter((c) =>
    c.company.toLowerCase().includes(search.toLowerCase().trim())
  );

  const totalHired = companyWise.reduce((acc, c) => acc + (c.studentsHired || 0), 0);
  const highestOffer = stats?.packages?.highest ?? stats?.highestPackage ?? 0;
  const averageOffer = stats?.packages?.average ?? stats?.averagePackage ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Corporate Recruitment KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Corporate Partners</span>
          <div className="text-2xl font-bold text-[#1D1D1F] mt-1">
            {companyWise.length}
          </div>
          <p className="text-[11px] text-[#86868B] mt-0.5">Active hiring companies</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Total Recruits</span>
          <div className="text-2xl font-bold text-[#0071E3] mt-1">
            {totalHired}
          </div>
          <p className="text-[11px] text-[#0071E3] mt-0.5">Selected students</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Highest Package</span>
          <div className="text-2xl font-bold text-[#34C759] mt-1">
            ₹{highestOffer > 0 ? highestOffer.toFixed(2) : "0.00"} <span className="text-xs font-normal text-[#86868B]">LPA</span>
          </div>
          <p className="text-[11px] text-[#34C759] mt-0.5">Top corporate offer</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <span className="text-[11px] font-medium text-[#86868B] uppercase">Average Package</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            ₹{averageOffer > 0 ? averageOffer.toFixed(2) : "0.00"} <span className="text-xs font-normal text-[#86868B]">LPA</span>
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5">Batch campus benchmark</p>
        </div>
      </div>

      {/* Main Companies Card */}
      <Card className="rounded-3xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-black/[0.06] p-5 sm:p-6 bg-[#F5F5F7]/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0071E3]" /> Corporate Recruiters & Placement Rankings
              </CardTitle>
              <CardDescription className="text-xs text-[#86868B] mt-0.5">
                Overview of corporate recruitment partners, selections, and compensation tiers
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportCompanyWise()}
                disabled={isExportingCompanyXlsx}
                className="gap-1.5 text-xs font-medium h-8.5 rounded-lg border-black/[0.08] bg-white hover:bg-neutral-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#5856D6]" />
                {isExportingCompanyXlsx ? "Exporting..." : "Export All to Excel"}
              </Button>

              <Link href="/tpo/drives?create=true">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-medium h-8.5 px-3.5 rounded-lg bg-[#0071E3] text-white hover:bg-[#0071E3]/90 shadow-xs"
                >
                  <Briefcase className="h-3.5 w-3.5" /> Post Company Drive
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
              <Input
                placeholder="Search company by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-white border-black/[0.1] focus-visible:ring-[#0071E3]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <div className="py-16 text-center text-[#86868B]">
              <Building2 className="h-10 w-10 mx-auto text-[#86868B]/40 mb-2" />
              <p className="text-sm font-medium text-[#1D1D1F]">
                {search ? "No matching companies found" : "No company placement records yet"}
              </p>
              <p className="text-xs mt-1">
                {search ? "Try searching for a different company name" : "Placement records will appear here as drives conclude"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {filteredCompanies.map((comp, idx) => (
                <div
                  key={comp.company}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-[#F5F5F7]/40 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F5F5F7] text-xs font-bold text-[#86868B]">
                      {idx + 1}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0071E3]/10 text-[#0071E3] font-bold text-sm shrink-0">
                      {comp.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1D1D1F]">{comp.company}</h4>
                      <p className="text-xs text-[#86868B] flex items-center gap-1.5 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span className="font-medium text-[#1D1D1F]">{comp.studentsHired} Students Selected</span>
                        {comp.details && comp.details.length > 0 && (
                          <span className="text-[11px] text-[#86868B]">
                            ({comp.details.map((d) => d.branch).filter((v, i, a) => a.indexOf(v) === i).join(", ")})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <div className="text-sm sm:text-base font-bold text-[#0071E3]">
                        ₹{comp.avgPackage.toFixed(2)} LPA
                      </div>
                      <span className="block text-[10px] text-[#86868B]">Average Package</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportCompanyWise(comp.companyId)}
                        disabled={isExportingCompanyXlsx}
                        title={`Export selections for ${comp.company}`}
                        className="h-8.5 px-2.5 text-xs font-medium border-black/[0.08] hover:bg-neutral-50 gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5 text-[#86868B]" />
                        <span>Export Excel</span>
                      </Button>

                      <Link href={`/tpo/drives?search=${encodeURIComponent(comp.company)}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8.5 px-2 text-xs font-medium text-[#0071E3] hover:bg-[#0071E3]/10"
                        >
                          Drives <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
