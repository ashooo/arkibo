"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudent } from "@/lib/student-context";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  ScanText,
  Check,
  ChevronRight,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { student, applicationType, toggleApplicationType } = useStudent();
  const [highlightMissing, setHighlightMissing] = useState(false);

  const isRenewal = applicationType === "renewal";

  // Dynamic Checklist Data based on active track
  const checklistItems = isRenewal
    ? [
        {
          id: "req-1",
          title: "Official Grade Report (OGR)",
          subtitle: "Term GWA: 1.46 • Verified via Lumen OCR",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-2",
          title: "Certificate of Registration (COR)",
          subtitle: "18 units enrolled for current term",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-3",
          title: "Student ID Card",
          subtitle: "AY 2024–2025 sticker verified",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-4",
          title: "Barangay Certificate",
          subtitle: "Brgy. San Nicolas residency proof",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-5",
          title: "Assessment Slip",
          subtitle: "Stamped accounting slip required",
          status: "missing",
          badge: "Required",
        },
      ]
    : [
        {
          id: "req-new-1",
          title: "Report Card (Form 138)",
          subtitle: "GWA: 89.5% • Verified",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-new-2",
          title: "Admission Slip",
          subtitle: "BS Information Technology accepted",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-new-3",
          title: "Certificate of Indigency",
          subtitle: "Proof of family income from Barangay",
          status: "missing",
          badge: "Required",
        },
        {
          id: "req-new-4",
          title: "Parent's Voter Certificate",
          subtitle: "Pasig City COMELEC registration",
          status: "missing",
          badge: "Required",
        },
      ];

  const doneCount = checklistItems.filter((i) => i.status === "validated").length;
  const totalCount = checklistItems.length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  const handleUploadMissingClick = () => {
    setHighlightMissing(true);
    toast.info("Opening Document Scanner...", {
      description: "Upload your Assessment Slip to extract text with Lumen OCR.",
    });
    setTimeout(() => {
      setHighlightMissing(false);
      router.push("/scanner");
    }, 800);
  };

  const handleItemClick = (item: (typeof checklistItems)[0]) => {
    if (item.status === "validated") {
      toast.success(`${item.title}: Validated`, {
        description: item.subtitle,
      });
    } else {
      toast.error(`${item.title}: Missing`, {
        description: "Please upload this document to complete your submission.",
        action: {
          label: "Upload",
          onClick: () => router.push("/scanner"),
        },
      });
    }
  };

  // Lumen OCR Extracted Sample Grades
  const ocrGrades = [
    { code: "IT 201", name: "Data Structures & Algorithms", grade: "1.75", verified: true },
    { code: "IT 202", name: "Object-Oriented Programming", grade: "1.50", verified: true },
    { code: "IT 203", name: "Web Systems & Tech", grade: "1.25", verified: true, isHighlight: true },
    { code: "GE 102", name: "Purposive Communication", grade: "1.75", verified: true },
    { code: "GE 103", name: "The Contemporary World", grade: "1.50", verified: true },
    { code: "NSTP 2", name: "CWTS Community Service", grade: "1.00", verified: true, isSecondary: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Welcome & Status Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-low dark:bg-dark-card border border-slate-border/70 dark:border-dark-border p-5 sm:p-7 shadow-subtle transition-colors">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-slate-100 tracking-tight">
              Welcome back, {student.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-on-surface-variant dark:text-slate-400">
              {totalCount - doneCount === 0 ? (
                <span className="font-semibold text-secondary">
                  All requirements are complete and ready for submission.
                </span>
              ) : (
                <>
                  <span className="font-semibold text-tertiary">
                    {totalCount - doneCount} requirement left
                  </span>{" "}
                  to complete your {isRenewal ? "renewal" : "application"}.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-soft dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span>{isRenewal ? "Renewal Window Open" : "Application Window Open"}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleApplicationType}
              className="text-xs font-bold"
            >
              Switch to {isRenewal ? "New Applicant" : "Renewal"}
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 4-Grid Key Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: GWA */}
        <div className="rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border p-5 flex flex-col justify-between shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Grade Average (GWA)
            </span>
            <div className="p-1.5 rounded-lg bg-secondary-soft dark:bg-emerald-950/60 text-secondary">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface dark:text-slate-100 font-mono">1.44</span>
            <Badge variant="success" size="sm">Qualified</Badge>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            Retention: 2.00 or better
          </p>
        </div>

        {/* Metric 2: Units Passed */}
        <div className="rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border p-5 flex flex-col justify-between shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Units Completed
            </span>
            <div className="p-1.5 rounded-lg bg-primary-soft dark:bg-blue-950/60 text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface dark:text-slate-100 font-mono">54</span>
            <Badge variant="primary" size="sm">Passing</Badge>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            54 of 144 curriculum units
          </p>
        </div>

        {/* Metric 3: Progress */}
        <div className="rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border p-5 flex flex-col justify-between shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Progress
            </span>
            <div className="p-1.5 rounded-lg bg-tertiary-soft dark:bg-amber-950/60 text-tertiary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-tertiary font-mono">{progressPercent}%</span>
            <Badge variant="warning" size="sm">{doneCount}/{totalCount} Ready</Badge>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            {totalCount - doneCount} document remaining
          </p>
        </div>

        {/* Metric 4: Days Remaining */}
        <div className="rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border p-5 flex flex-col justify-between shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Days Remaining
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-cardAlt text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface dark:text-slate-100 font-mono">12</span>
            <Badge variant="error" size="sm">Days Left</Badge>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            Deadline: Feb 28, 2025
          </p>
        </div>
      </section>

      {/* 3. Main Section: Two Columns (Action Center & Lumen OCR) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Requirements Action Center (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-on-surface dark:text-slate-100">
                  {isRenewal ? "Renewal Checklist" : "Application Checklist"}
                </h2>
                <p className="text-xs text-on-surface-variant dark:text-slate-400">
                  {isRenewal ? "AY 2024–2025 Renewal Packet" : "Initial Application Documents"}
                </p>
              </div>
              <Badge variant="success" size="md">
                {doneCount} of {totalCount} Done
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1.5 bg-surface-low dark:bg-dark-cardAlt p-3 rounded-lg border border-slate-border/50 dark:border-dark-border/60">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Readiness</span>
                <span className="text-primary font-bold font-mono">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} indicatorColor="bg-primary" />
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:shadow-subtle",
                    item.status === "validated"
                      ? "bg-surface-low dark:bg-dark-cardAlt/50 border-slate-border/60 dark:border-dark-border/60"
                      : "bg-error-soft/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/60",
                    highlightMissing && item.status === "missing" ? "ring-2 ring-primary scale-[1.01]" : ""
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        item.status === "validated"
                          ? "bg-secondary-soft dark:bg-emerald-950/60 text-secondary"
                          : "bg-error text-white"
                      )}
                    >
                      {item.status === "validated" ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-on-surface dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-on-surface-variant dark:text-slate-400 truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 ml-2">
                    {item.status === "validated" ? (
                      <Badge variant="success" size="sm">Validated</Badge>
                    ) : (
                      <Badge variant="error" size="sm">Required</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-border/60 dark:border-dark-border/60">
              <Button
                variant="primary"
                size="md"
                onClick={handleUploadMissingClick}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Missing Document</span>
              </Button>

              <Link href="/checklist">
                <Button variant="ghost" size="md">
                  <span>Full Checklist</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Lumen OCR Verification Spotlight (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary-soft dark:bg-blue-950/60 flex items-center justify-center text-primary dark:text-blue-300">
                  <ScanText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface dark:text-slate-100 flex items-center gap-1.5">
                    <span>Lumen OCR</span>
                    <Badge variant="primary" size="sm">Verified</Badge>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Extracted Transcript</span>
                </div>
              </div>
              <Badge variant="success" size="sm">100% Match</Badge>
            </div>

            {/* Extraction Rows */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>Course</span>
                <span>Grade</span>
              </div>

              {ocrGrades.map((g) => (
                <div
                  key={g.code}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                    g.isHighlight
                      ? "bg-primary-soft/40 dark:bg-blue-950/30 border border-primary/30"
                      : "bg-surface-low dark:bg-dark-cardAlt/50 border border-slate-border/50 dark:border-dark-border/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-bold text-on-surface dark:text-slate-100 truncate">
                      {g.code}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                      • {g.name}
                    </span>
                    {g.isHighlight && (
                      <Badge variant="primary" size="sm" className="text-[10px] py-0 px-1.5">
                        Matched
                      </Badge>
                    )}
                  </div>

                  <span
                    className={cn(
                      "font-mono font-bold px-2 py-0.5 rounded text-xs shrink-0 shadow-subtle",
                      g.isSecondary
                        ? "bg-secondary-soft dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        : g.isHighlight
                        ? "bg-white dark:bg-dark-card text-primary dark:text-blue-300 border border-primary/20 dark:border-primary/40"
                        : "bg-white dark:bg-dark-card text-on-surface dark:text-slate-200 border border-slate-border dark:border-dark-border"
                    )}
                  >
                    {g.grade}
                  </span>
                </div>
              ))}
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-border/60 dark:border-dark-border/60 text-xs">
              <span className="text-secondary font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>6 of 6 subjects verified</span>
              </span>

              <Link
                href="/grades"
                className="text-primary dark:text-primary-light font-bold hover:underline flex items-center gap-1"
              >
                <span>Edit in Grades</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Bottom Row: Guidelines */}
      <section className="rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border p-5 sm:p-6 shadow-subtle transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface dark:text-slate-100">
              Scholar Guidelines & Support
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Office hours: Mon–Fri, 8:00 AM – 5:00 PM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface-low dark:bg-dark-cardAlt/50 border border-slate-border/60 dark:border-dark-border/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface dark:text-slate-100 block mb-1">
                Grade Requirement
              </span>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Maintain semestral GWA of 2.00 or better with no unremoved failing marks.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-border/40 dark:border-dark-border/40">
              <Badge variant="success" size="sm">Your GWA: 1.44 (Qualified)</Badge>
            </div>
          </div>

          <div className="rounded-lg bg-surface-low dark:bg-dark-cardAlt/50 border border-slate-border/60 dark:border-dark-border/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface dark:text-slate-100 block mb-1">
                Community Service
              </span>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Render at least 8 hours of community service or participate in city youth projects.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-border/40 dark:border-dark-border/40">
              <Badge variant="success" size="sm">8 Hours Completed</Badge>
            </div>
          </div>

          <div className="rounded-lg bg-surface-low dark:bg-dark-cardAlt/50 border border-slate-border/60 dark:border-dark-border/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface dark:text-slate-100 block mb-1">
                Scholarship Office
              </span>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                4th Floor, Pasig City Hall. Inquiries on validation and disbursement.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-border/40 dark:border-dark-border/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>(02) 8643-1111</span>
              <Link href="/notifications" className="text-primary font-bold hover:underline">
                Notices
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
