import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
        403 - Access Denied
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md text-sm">
        You do not have the required role permissions to view this section of the portal. Please contact the Central TPO administrator if you believe this is an error.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/login">
          <Button variant="primary" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Return to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
