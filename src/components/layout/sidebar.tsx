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
  ArrowLeftRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
      name: "Checklist",
      href: "/checklist",
      icon: CheckSquare,
      badge: applicationType === "renewal" ? "3 Left" : "5 Left",
      badgeColor: "bg-tertiary-soft dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
    },
    {
      name: "Scanner & OCR",
      href: "/scanner",
      icon: ScanText,
      badge: "Lumen",
      badgeColor: "bg-primary-soft dark:bg-blue-950/60 text-primary dark:text-blue-300",
    },
    {
      name: "My Documents",
      href: "/documents",
      icon: FolderArchive,
      badge: null,
    },
    {
      name: "Grades",
      href: "/grades",
      icon: GraduationCap,
      badge: null,
    },
    {
      name: "Announcements",
      href: "/notifications",
      icon: Bell,
      badge: "Sample",
      badgeColor: "bg-slate-100 dark:bg-dark-cardAlt text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between bg-surface-low dark:bg-dark-surface border-r border-outline-variant/30 dark:border-dark-border p-space-lg transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-space-lg">
          {/* Brand Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-space-sm group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm font-bold text-lg group-hover:scale-105 transition-transform">
                  SR
                </div>
                <span className="font-bold text-xl text-primary tracking-tight group-hover:text-primary-light transition-colors">
                  ScholarReady
                </span>
              </Link>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-cardAlt lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-snug">
              Pasig College Scholar Portal
            </p>

            {/* Status Pill */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-secondary-soft dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>Pasig Scholar</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1" aria-label="Portal Navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-space-md py-2.5 rounded-lg text-sm font-semibold transition-all select-none active:scale-[0.98]",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-dark-cardAlt hover:text-on-surface dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
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

        {/* Footer Track Switcher & Theme Control */}
        <div className="flex flex-col gap-space-sm pt-space-md border-t border-outline-variant/30 dark:border-dark-border">
          <div className="flex items-center justify-between text-xs text-on-surface-variant dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500">
              Active Track
            </span>
            <button
              onClick={toggleApplicationType}
              className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
              title="Toggle between Renewal and New Applicant"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Switch</span>
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-slate-border/80 dark:border-dark-border shadow-subtle flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface dark:text-slate-100 capitalize">
                {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}
              </span>
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  applicationType === "renewal" ? "bg-secondary" : "bg-primary"
                )}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400 leading-tight">
              {applicationType === "renewal"
                ? "Grade Report, Registration & GWA"
                : "Admission, Residency & Indigency"}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>{student.term}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
