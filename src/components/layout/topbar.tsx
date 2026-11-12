"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useStudent } from "@/lib/student-context";
import {
  School,
  CheckCircle2,
  Menu,
  Clock,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopbarProps {
  onMenuClick?: () => void;
}

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/checklist": "Checklist",
  "/scanner": "Scanner & OCR",
  "/documents": "My Documents",
  "/grades": "Grades",
  "/notifications": "Announcements",
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { student, applicationType, toggleApplicationType } = useStudent();
  const pageName = pageNames[usePathname()] ?? "ScholarReady";

  return (
    <header className="relative z-30 flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-slate-border bg-white px-4 transition-colors dark:border-dark-border dark:bg-dark-surface sm:px-6 lg:px-8">
      {/* Left: Mobile Menu & Institution */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-cardAlt lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2.5 text-xs text-on-surface-variant dark:text-slate-400 font-medium">
          <div className="hidden shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-primary-soft dark:bg-orange-950/60 text-primary dark:text-orange-300 sm:flex">
            <School className="w-4 h-4" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-bold text-on-surface dark:text-slate-100 text-sm sm:text-base">
              {pageName}
            </span>
            <span className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
              {student.school}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Track Switcher, Deadline, Theme & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Track Switcher Button */}
        <button
          onClick={toggleApplicationType}
          className={cn(
            "hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-subtle hover:scale-[1.02] active:scale-95",
            applicationType === "renewal"
              ? "bg-secondary-soft dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
              : "bg-primary-soft dark:bg-blue-950/60 text-primary-dark dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
          )}
          title="Click to toggle track"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Track: {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}</span>
        </button>

        {/* Concise Deadline Notice */}
        <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-cardAlt text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-dark-border">
          <Clock className="w-3.5 h-3.5 text-tertiary" />
          <span>Deadline: <strong>Feb 28 (12 days left)</strong></span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Student Avatar & Metadata */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-outline-variant/30 dark:border-dark-border">
          <div className="text-right hidden sm:flex flex-col">
            <div className="flex items-center justify-end gap-1">
              <span className="text-sm font-bold text-on-surface dark:text-slate-100">
                {student.name}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {student.yearLevel}
            </span>
          </div>

          {/* Initials Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft dark:bg-blue-950/60 text-primary dark:text-blue-300 font-bold text-sm ring-2 ring-primary/20">
            {student.name.split(" ").map((n) => n[0]).join("")}
          </div>
        </div>
      </div>
    </header>
  );
}
