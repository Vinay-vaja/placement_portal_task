import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { GraduationCap, ExternalLink, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                LDCE Placements
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              L.D. College of Engineering, Ahmedabad. Empowering students with industry-leading placement opportunities.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/companies" className="hover:text-blue-600 transition-colors">
                  Visiting Companies
                </Link>
              </li>
              <li>
                <Link href="/placements" className="hover:text-blue-600 transition-colors">
                  Active Drives
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-blue-600 transition-colors">
                  Placement Statistics
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.links.officialSite}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Official LDCE Website <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Student & Recruiter Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Portals
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
                  Recruiter Registration
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-600 transition-colors">
                  TPO Admin Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Contact TPO Cell
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>Opp. Gujarat University, Navrangpura, Ahmedabad, Gujarat 380015</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>placement@ldce.ac.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>+91 79 2630 6752</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} L.D. College of Engineering. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
