"use client";

import React from "react";

interface CollegeLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function CollegeLogo({
  size = 46,
  className = "",
  showText = true,
  textClassName = "text-sm font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]",
}: CollegeLogoProps) {
  // Padding scales proportionally with size
  const paddingClass = size >= 64 ? "p-2 rounded-3xl" : "p-1 rounded-xl";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`logo-badge flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.08] dark:ring-white/30 shrink-0 transition-all duration-200 ${paddingClass}`}
        style={{ width: `${size}px`, height: `${size}px`, backgroundColor: "#ffffff" }}
      >
        <img
          src="/ldce-logo.png"
          alt="L.D. College of Engineering Logo"
          className="h-full w-full object-contain"
        />
      </div>

      {showText && (
        <span className={textClassName}>
          LDCE Placements
        </span>
      )}
    </div>
  );
}
