"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStudent } from "@/lib/student-context";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ScanText,
  Check,
  ChevronRight,
  Upload,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { student, applicationType, toggleApplicationType } = useStudent();
  const [highlightMissing, setHighlightMissing] = useState(false);

  const handleUploadMissingClick = () => {
    setHighlightMissing(true);
    setTimeout(() => setHighlightMissing(false), 2000);
  };

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
          subtitle: "18 units enrolled • Term validated",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-3",
          title: "Student ID Card with Term Sticker",
          subtitle: "AY 2024–2025 validity confirmed",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-4",
          title: "Barangay Certificate of Residency",
          subtitle: "Brgy. San Nicolas, Pasig City",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-5",
          title: "Assessment / Accounting Slip",
          subtitle: "Current semester stamped accounting slip needed",
          status: "missing",
          badge: "Required",
        },
      ]
    : [
        {
          id: "req-new-1",
          title: "High School Report Card / Form 138",
          subtitle: "GWA: 89.5% • Verified",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-new-2",
          title: "College Admission Slip (PLP)",
          subtitle: "BS Information Technology accepted",
          status: "validated",
          badge: "Validated",
        },
        {
          id: "req-new-3",
          title: "Certificate of Indigency / Proof of Income",
          subtitle: "Parent ITR / Indigency from Barangay",
          status: "missing",
          badge: "Required",
        },
        {
          id: "req-new-4",
          title: "Voter's Certification of Parent/Guardian",
          subtitle: "Pasig City COMELEC issued",
          status: "missing",
          badge: "Required",
        },
      ];

  const doneCount = checklistItems.filter((i) => i.status === "validated").length;
  const totalCount = checklistItems.length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  // Lumen OCR Extracted Sample Grades
  const ocrGrades = [
    { code: "IT 201", name: "Data Structures & Algorithms", grade: "1.75", verified: true },
    { code: "IT 202", name: "Object-Oriented Programming", grade: "1.50", verified: true },
    { code: "IT 203", name: "Web Systems & Technologies", grade: "1.25", verified: true, isHighlight: true },
    { code: "GE 102", name: "Purposive Communication", grade: "1.75", verified: true },
    { code: "GE 103", name: "The Contemporary World", grade: "1.50", verified: true },
    { code: "NSTP 2", name: "CWTS Community Service", grade: "1.00", verified: true, isSecondary: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Welcome & Status Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-low border border-slate-border/70 p-6 sm:p-8 shadow-subtle">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Welcome back, {student.name.split(" ")[0]}!
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant">
              {totalCount - doneCount === 0 ? (
                <span className="font-semibold text-secondary">
                  All requirements for your packet are ready for submission.
                </span>
              ) : (
                <>
                  <span className="font-semibold text-tertiary">
                    You have {totalCount - doneCount} requirement{totalCount - doneCount > 1 ? "s" : ""} left
                  </span>{" "}
                  to prepare for your {isRenewal ? "renewal packet" : "application"}.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-soft text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span>{isRenewal ? "Open for Term 1 Renewals" : "Open for AY 2024 Batch 1"}</span>
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
        <div className="rounded-xl bg-white border border-slate-border p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between text-slate-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              General Weighted Avg
            </span>
            <div className="p-1.5 rounded-lg bg-secondary-soft text-secondary">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">1.44</span>
            <Badge variant="success" size="sm">Qualified</Badge>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Retention ceiling: 2.00 or better
          </p>
        </div>

        {/* Metric 2: Units Passed */}
        <div className="rounded-xl bg-white border border-slate-border p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between text-slate-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Units Completed
            </span>
            <div className="p-1.5 rounded-lg bg-primary-soft text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">54</span>
            <Badge variant="primary" size="sm">Passing</Badge>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            54 of 144 total BS IT units
          </p>
        </div>

        {/* Metric 3: Renewal / Application Progress */}
        <div className="rounded-xl bg-white border border-slate-border p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between text-slate-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Packet Progress
            </span>
            <div className="p-1.5 rounded-lg bg-tertiary-soft text-tertiary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-tertiary font-mono">{progressPercent}%</span>
            <Badge variant="warning" size="sm">{doneCount} of {totalCount} Done</Badge>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {totalCount - doneCount} requirement pending
          </p>
        </div>

        {/* Metric 4: Days Remaining */}
        <div className="rounded-xl bg-white border border-slate-border p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between text-slate-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Days Remaining
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">12</span>
            <Badge variant="error" size="sm">Days Left</Badge>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Target freeze: Feb 28, 2025
          </p>
        </div>
      </section>

      {/* 3. Main Section: Two Columns (Action Center & Lumen OCR Verified) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Renewal Center & Checklist (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {isRenewal ? "Renewal Checklist" : "Application Checklist"}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {isRenewal ? "AY 2024–2025 Batch 1 Endorsement Packet" : "AY 2024–2025 Initial Verification"}
                </p>
              </div>
              <Badge variant="success" size="md">
                {doneCount} of {totalCount} Done
              </Badge>
            </div>

            {/* Packet Progress Bar */}
            <div className="flex flex-col gap-1.5 bg-surface-low p-3 rounded-lg border border-slate-border/50">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-body">Overall Readiness</span>
                <span className="text-primary font-bold font-mono">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} indicatorColor="bg-primary" />
            </div>

            {/* Checklist Items Rows */}
            <div className="flex flex-col gap-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    item.status === "validated"
                      ? "bg-surface-low border-slate-border/60"
                      : "bg-error-soft/60 border-red-200",
                    highlightMissing && item.status === "missing" ? "ring-2 ring-primary scale-[1.01]" : ""
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        item.status === "validated"
                          ? "bg-secondary-soft text-secondary"
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
                      <span className="text-sm font-bold text-on-surface truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-on-surface-variant truncate">
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
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-border/60">
              <Link href="/scanner">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleUploadMissingClick}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload & Scan Missing Document</span>
                </Button>
              </Link>

              <Link href="/checklist">
                <Button variant="ghost" size="md">
                  <span>Full Checklist Details</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Lumen OCR Verification Spotlight (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
                  <ScanText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-1.5">
                    <span>Lumen OCR</span>
                    <Badge variant="primary" size="sm">Real Gateway</Badge>
                  </h3>
                  <span className="text-xs text-slate-muted">Verified Transcript Extraction</span>
                </div>
              </div>
              <Badge variant="success" size="sm">100% Match</Badge>
            </div>

            {/* Tabular Monospace Extraction Rows */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Subject Course</span>
                <span>Term Mark</span>
              </div>

              {ocrGrades.map((g) => (
                <div
                  key={g.code}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                    g.isHighlight
                      ? "bg-primary-soft/40 border border-primary/30"
                      : "bg-surface-low border border-slate-border/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-bold text-on-surface truncate">
                      {g.code}
                    </span>
                    <span className="text-slate-muted truncate hidden sm:inline">
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
                        ? "bg-secondary-soft text-emerald-800"
                        : g.isHighlight
                        ? "bg-white text-primary border border-primary/20"
                        : "bg-white text-on-surface border border-slate-border"
                    )}
                  >
                    {g.grade}
                  </span>
                </div>
              ))}
            </div>

            {/* OCR Verified Status & Link */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-border/60 text-xs">
              <span className="text-secondary font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>6 of 6 subjects extracted</span>
              </span>

              <Link
                href="/grades"
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>Edit in Grade History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Bottom Row: Scholar Guidelines & Announcements Preview (Dev 3) */}
      <section className="rounded-xl bg-white border border-slate-border p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface">
              Scholar Guidelines & Pasig City Support
            </h3>
          </div>
          <span className="text-xs text-slate-muted hidden sm:inline">
            Office hours: Mon–Fri, 8:00 AM – 5:00 PM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Guideline 1 */}
          <div className="rounded-lg bg-surface-low border border-slate-border/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface block mb-1">
                Academic Grade Requirement
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Maintain a semestral GWA of 2.00 or better with no failing or unremoved incomplete grades.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-border/40">
              <Badge variant="success" size="sm">Your GWA: 1.44 (Compliant)</Badge>
            </div>
          </div>

          {/* Guideline 2 */}
          <div className="rounded-lg bg-surface-low border border-slate-border/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface block mb-1">
                Community Service & SPES
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Render at least 8 hours of community service or participate in approved city civic engagement projects.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-border/40">
              <Badge variant="success" size="sm">8 Hours Completed</Badge>
            </div>
          </div>

          {/* Guideline 3 */}
          <div className="rounded-lg bg-surface-low border border-slate-border/60 p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface block mb-1">
                Pasig Scholarship Office (EdTech)
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                4th Floor, Pasig City Hall, Caruncho Avenue. Inquiries on allowance disbursement & validation.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-border/40 flex items-center justify-between text-xs text-slate-muted font-mono">
              <span>(02) 8643-1111</span>
              <Link href="/notifications" className="text-primary font-bold hover:underline">
                Announcements
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
