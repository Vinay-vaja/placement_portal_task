import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C4] text-white shadow-sm focus:ring-[#0071E3]/40 border border-transparent",
      secondary:
        "bg-[#1D1D1F] hover:bg-[#2D2D2F] active:bg-[#111112] text-white shadow-sm focus:ring-[#1D1D1F]/40 border border-transparent",
      outline:
        "border border-black/[0.12] bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#1D1D1F] focus:ring-black/10 shadow-sm",
      ghost:
        "hover:bg-black/[0.04] active:bg-black/[0.08] text-[#1D1D1F] focus:ring-black/10",
      destructive:
        "bg-[#FF3B30] hover:bg-[#E0342B] active:bg-[#C92E26] text-white shadow-sm focus:ring-[#FF3B30]/40 border border-transparent",
    };

    const sizes = {
      sm: "px-3.5 py-1.5 text-xs h-8",
      md: "px-4.5 py-2 text-xs sm:text-sm h-10",
      lg: "px-6 py-2.5 text-sm sm:text-base h-11",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-3.5 w-3.5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Processing...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
