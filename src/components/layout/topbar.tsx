"use client";

import React from "react";
import { useStudent } from "@/lib/student-context";
import {
  School,
  CheckCircle2,
  Menu,
  Clock,
  ArrowLeftRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { student, applicationType, toggleApplicationType } = useStudent();

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Menu & Institution Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-body hover:bg-surface-high hover:text-on-surface lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-md bg-primary-soft text-primary">
            <School className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
            <span className="font-bold text-on-surface text-sm sm:text-xs">
              {student.school}
            </span>
            <span className="hidden sm:inline text-slate-400">/</span>
            <span className="text-slate-muted hidden md:inline">
              Pasig College Scholar Portal
            </span>
          </div>
        </div>
      </div>

      {/* Right: Track Pill, Countdown, Student Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Track Switcher Button */}
        <button
          onClick={toggleApplicationType}
          className={cn(
            "hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-subtle hover:scale-[1.02]",
            applicationType === "renewal"
              ? "bg-secondary-soft text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              : "bg-primary-soft text-primary-dark border-blue-200 hover:bg-blue-100"
          )}
          title="Click to switch application mode"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Track: {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}</span>
        </button>

        {/* Deadline Notice */}
        <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-tertiary" />
          <span>Batch 1 Freeze: <strong>12 Days Left</strong></span>
        </div>

        {/* Student Avatar & Metadata */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-outline-variant/30">
          <div className="text-right hidden sm:flex flex-col">
            <div className="flex items-center justify-end gap-1">
              <span className="text-sm font-bold text-on-surface">
                {student.name}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
            </div>
            <span className="text-[11px] text-slate-muted">
              {student.program} • {student.yearLevel}
            </span>
          </div>

          {/* Initials Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-sm ring-2 ring-primary/20">
            {student.name.split(" ").map((n) => n[0]).join("")}
          </div>
        </div>
      </div>
    </header>
  );
}

