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
  textClassName = "text-sm font-semibold tracking-tight text-[#1D1D1F]",
}: CollegeLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/ldce-logo.png"
        alt="L.D. College of Engineering Logo"
        className="object-contain flex-shrink-0"
        style={{ width: `${size}px`, height: `${size}px` }}
      />

      {showText && (
        <span className={textClassName}>
          LDCE Placements
        </span>
      )}
    </div>
  );
}
