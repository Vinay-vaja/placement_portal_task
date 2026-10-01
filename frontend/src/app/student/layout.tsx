"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RBACGuard } from "@/providers/rbac-guard";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CollegeLogo } from "@/components/shared/college-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  User,
  Briefcase,
  FileCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Academic Profile", href: "/student/profile", icon: User },
    { label: "Recruitment Drives", href: "/student/drives", icon: Briefcase },
    { label: "My Applications", href: "/student/applications", icon: FileCheck },
  ];

  return (
    <RBACGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col selection:bg-[#0071E3]/20">
        {/* Apple Translucent Top Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] bg-[#FBFBFD]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            {/* Brand Logo & Nav */}
            <div className="flex items-center gap-7">
              <Link href="/student/drives" className="transition-opacity hover:opacity-85">
                <CollegeLogo size={46} />
              </Link>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-black/[0.06] text-[#0071E3]"
                          : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.03]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#0071E3]" : "text-[#86868B]"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Student Controls */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071E3] text-white text-[11px] font-medium">
                  {user?.student?.fullName ? user.student.fullName.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="text-left text-xs leading-none">
                  <span className="font-medium text-[#1D1D1F] block truncate max-w-[120px]">
                    {user?.student?.fullName || "Student"}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-xs font-medium text-[#86868B] hover:text-[#FF3B30] h-8 px-2.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>

            {/* Mobile menu trigger */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-[#1D1D1F]"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-b border-black/[0.06] bg-white px-4 pt-3 pb-5 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-black/[0.06]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071E3] text-white font-medium text-xs">
                  {user?.student?.fullName ? user.student.fullName.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1D1D1F]">{user?.student?.fullName || "Student"}</p>
                  <p className="text-[11px] text-[#86868B]">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium ${
                        isActive ? "bg-black/[0.05] text-[#0071E3]" : "text-[#1D1D1F]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full justify-center gap-2 text-xs text-[#FF3B30] h-9"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 py-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-black/[0.06] bg-white/50 py-4 text-center text-xs text-[#86868B]">
          Training & Placement Cell • L.D. College of Engineering, Ahmedabad
        </footer>
      </div>
    </RBACGuard>
  );
}
