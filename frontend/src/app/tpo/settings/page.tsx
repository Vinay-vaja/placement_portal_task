"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { tpoService } from "@/services/tpo.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";

export default function TPOSettingsPage() {
  const [isPlacementActive, setIsPlacementActive] = useState(true);
  const [sem6Required, setSem6Required] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await tpoService.getSettings();
        if (res.data) {
          const s = res.data;
          if (s.placement_active !== undefined) {
            setIsPlacementActive(Boolean(s.placement_active));
          }
          if (s.sem6_required !== undefined) {
            setSem6Required(Boolean(s.sem6_required));
          }
        }
      } catch (err: unknown) {
        toast.error((err as Error)?.message || "Failed to load portal settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await Promise.all([
        tpoService.updateSetting("placement_active", isPlacementActive),
        tpoService.updateSetting("sem6_required", sem6Required),
      ]);
      toast.success("Portal settings saved and enforced successfully!");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to save portal settings");
    } finally {
      setIsSaving(false);
    }
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
          <span>TPO Portal Settings saved successfully to the database!</span>
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
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span>Loading portal configuration...</span>
            </div>
          ) : (
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
                  aria-label="Toggle Placement Process Active"
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
                  aria-label="Toggle Require Semester 6 SPI"
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
                  disabled={isSaving}
                  className="gap-2 font-semibold text-xs shadow-md shadow-blue-500/20 px-6 py-2.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Configuration
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
