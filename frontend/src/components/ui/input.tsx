import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7]/80 px-3.5 py-2 text-xs sm:text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
            error && "border-[#FF3B30] focus:ring-[#FF3B30]/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#FF3B30] font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
