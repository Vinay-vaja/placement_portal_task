"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/providers/theme-provider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`h-9 w-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.08] text-[#86868B] transition-colors ${className}`}
        disabled
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
        isDark
          ? "bg-[#16161C] border border-white/10 text-amber-400 hover:bg-[#22222A] hover:text-amber-300 hover:border-amber-400/30 shadow-sm"
          : "bg-black/[0.04] border border-black/[0.06] text-[#1D1D1F] hover:bg-black/[0.08] hover:text-[#0071E3] hover:border-[#0071E3]/20"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
