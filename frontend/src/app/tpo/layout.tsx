"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RBACGuard } from "@/providers/rbac-guard";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

interface TPOLayoutProps {
  children: React.ReactNode;
}

export default function TPOLayout({ children }: TPOLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/tpo/dashboard", icon: LayoutDashboard },
    { label: "Student Verifications", href: "/tpo/students", icon: Users },
    { label: "Placement Drives", href: "/tpo/drives", icon: Briefcase },
    { label: "Portal Settings", href: "/tpo/settings", icon: Settings },
  ];

  return (
    <RBACGuard allowedRoles={["CENTRAL_TPO"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <Link href="/tpo/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold tracking-tight text-slate-900">
                      LDCE Placement Portal
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      TPO ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Training & Placement Cell • L.D. College of Engineering
                  </p>
                </div>
              </Link>

              {/* Desktop Nav Items */}
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-bold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Admin Controls */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2.5 rounded-full bg-slate-100 py-1.5 px-3 border border-slate-200">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Central TPO</p>
                  <p className="text-[10px] font-medium text-slate-500 truncate max-w-[140px]">
                    {user?.email}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  TPO
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Central TPO Admin</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
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
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium ${
                        isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700 hover:bg-slate-50"
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
                  className="w-full justify-center gap-2 text-xs text-red-600 border-red-200"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          Training & Placement Cell • L.D. College of Engineering, Ahmedabad
        </footer>
      </div>
    </RBACGuard>
  );
}
