"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X, Building2, User } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-[#FBFBFD]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0071E3] text-white shadow-sm">
            <GraduationCap className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
              LDCE Placements
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium text-[#1D1D1F]/70 hover:text-[#0071E3] transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-[#1D1D1F] gap-1.5 h-8 px-3">
              <User className="h-3.5 w-3.5 text-[#86868B]" />
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="text-xs font-medium h-8 px-3.5 bg-[#0071E3] hover:bg-[#0077ED]">
              Create Account
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1D1D1F]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-black/[0.06] bg-white px-4 pt-2 pb-5 space-y-3">
          <nav className="flex flex-col space-y-2">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#1D1D1F] hover:text-[#0071E3] py-1"
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-xs h-9">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center text-xs h-9">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
