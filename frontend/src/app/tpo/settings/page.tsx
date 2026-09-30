"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save, CheckCircle2, ShieldAlert } from "lucide-react";

export default function TPOSettingsPage() {
  const [isPlacementActive, setIsPlacementActive] = useState(true);
  const [sem6Required, setSem6Required] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Portal Configuration Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Configure semester SPI eligibility rules and overall placement drive access.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>TPO Portal Settings saved successfully!</span>
        </div>
      )}

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" /> Placement Rules & Access Control
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Control student registration and drive application status
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Rule 1 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900">Placement Process Active</h4>
                <p className="text-slate-500 text-[11px]">
                  When enabled, verified students can apply to campus placement drives.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlacementActive(!isPlacementActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPlacementActive ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPlacementActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Rule 2 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900">Require Semester 6 SPI</h4>
                <p className="text-slate-500 text-[11px]">
                  Require students to input Semester 6 SPI before submitting their academic profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSem6Required(!sem6Required)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  sem6Required ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    sem6Required ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="gap-2 font-semibold text-xs shadow-md shadow-blue-500/20 px-6 py-2.5"
              >
                <Save className="h-4 w-4" /> Save Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
