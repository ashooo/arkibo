"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudent } from "@/lib/student-context";
import {
  LayoutDashboard,
  CheckSquare,
  ScanText,
  FolderArchive,
  GraduationCap,
  Bell,
  CheckCircle2,
  ArrowLeftRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { applicationType, toggleApplicationType, student } = useStudent();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Scholarship Checklist",
      href: "/checklist",
      icon: CheckSquare,
      badge: applicationType === "renewal" ? "3 Pending" : "5 Pending",
      badgeColor: "bg-tertiary-soft text-amber-800",
    },
    {
      name: "Document Scanner",
      href: "/scanner",
      icon: ScanText,
      badge: "Lumen OCR",
      badgeColor: "bg-primary-soft text-primary",
    },
    {
      name: "My Documents",
      href: "/documents",
      icon: FolderArchive,
      badge: null,
    },
    {
      name: "Grade History",
      href: "/grades",
      icon: GraduationCap,
      badge: null,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: "Sample",
      badgeColor: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between bg-surface-low border-r border-outline-variant/30 p-space-lg transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-space-lg">
          {/* Brand Header */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-space-sm group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm font-bold text-lg">
                  SR
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-primary tracking-tight group-hover:text-primary-dark transition-colors">
                    ScholarReady
                  </span>
                </div>
              </Link>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-muted hover:bg-surface-high lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-snug mt-1">
              Independent Student Portal for Pasig College Students
            </p>

            {/* Civic Status Pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-secondary-soft text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>{student.school.includes("PLP") ? "PLP College Scholar" : "Pasig Scholar"}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" aria-label="Portal Navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-space-md py-2.5 rounded-lg text-sm font-semibold transition-all select-none",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-muted")} />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ml-1.5",
                        isActive ? "bg-white/20 text-white" : item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Track Switcher & Administrative Context */}
        <div className="flex flex-col gap-space-sm pt-space-md border-t border-outline-variant/30">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Active Track</span>
            <button
              onClick={toggleApplicationType}
              className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
              title="Click to toggle between Renewal Scholar and New Applicant mode"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Switch</span>
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-border/80 shadow-subtle flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface capitalize">
                {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}
              </span>
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  applicationType === "renewal" ? "bg-secondary" : "bg-primary"
                )}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              {applicationType === "renewal"
                ? "Tracking OGR, Certificate of Registration & Semester GWA"
                : "Tracking Admission Slip, Brgy Certificate & Requirements"}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-muted">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>LGU Pasig Stream</span>
            </div>
            <span>{student.term}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

