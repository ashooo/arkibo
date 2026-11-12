"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudent, ApplicationType } from "@/lib/student-context";
import {
  GraduationCap,
  FileCheck2,
  ScanText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

export default function OnboardingLandingPage() {
  const router = useRouter();
  const { setApplicationType, student } = useStudent();

  const handleSelectTrack = (type: ApplicationType) => {
    setApplicationType(type);
    toast.success(`Welcome! Selected ${type === "renewal" ? "Renewal Scholar" : "New Applicant"} track.`);
    router.push("/dashboard");
  };

  return (
    <div className="portal-landing min-h-screen bg-surface dark:bg-dark-bg text-on-surface dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-border bg-white dark:border-dark-border dark:bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-dark dark:bg-orange-950 dark:text-orange-200">
              <GraduationCap aria-hidden="true" size={21} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-primary tracking-tight">
                ScholarReady
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-cardAlt px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-dark-border">
                Pasig City
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Open Portal
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Track Selection */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center">
        {/* Civic Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-soft dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/80 mb-5 shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>Pasig City College Scholarship Portal</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-2xl mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-on-surface dark:text-slate-100 tracking-tight leading-tight">
            Prepare Your Scholarship Requirements <span className="text-primary">in Minutes</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-on-surface-variant dark:text-slate-400 leading-relaxed">
            Organize required documents, digitize grades using <strong>Lumen OCR</strong>, and track your semestral standing with zero guesswork.
          </p>
        </div>

        {/* Track Selection Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Renewal Track */}
          <div
            onClick={() => handleSelectTrack("renewal")}
            className="cursor-pointer group relative rounded-2xl bg-white dark:bg-dark-card border-2 border-primary/20 hover:border-primary dark:border-dark-border dark:hover:border-primary p-6 sm:p-7 transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 flex flex-col justify-between active:scale-[0.99]"
          >
            <div className="absolute -top-3 right-6">
              <Badge variant="success" size="sm" className="shadow-sm">
                Continuing Scholars
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-soft dark:bg-emerald-950/60 text-secondary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-on-surface dark:text-slate-100 group-hover:text-primary transition-colors">
                Renewal Scholar
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1.5 leading-relaxed">
                For continuing scholars renewing their scholarship for the upcoming semester.
              </p>

              <div className="mt-5 space-y-2 border-t border-slate-border/50 dark:border-dark-border/50 pt-3.5">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Official Grade Report (OGR) verification</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Certificate of Registration (COR) matching</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Term GWA compliance check (≤ 2.00)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-between group-hover:bg-primary-light"
              >
                <span>Select Renewal Track</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* New Applicant Track */}
          <div
            onClick={() => handleSelectTrack("new")}
            className="cursor-pointer group relative rounded-2xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border hover:border-primary/60 dark:hover:border-primary/60 p-6 sm:p-7 transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 flex flex-col justify-between active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft dark:bg-blue-950/60 text-primary">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary transition-colors">
                  <div className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-primary/50 transition-colors" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-on-surface dark:text-slate-100 group-hover:text-primary transition-colors">
                New Applicant
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1.5 leading-relaxed">
                For incoming freshmen or first-time scholarship applicants submitting initial documents.
              </p>

              <div className="mt-5 space-y-2 border-t border-slate-border/50 dark:border-dark-border/50 pt-3.5">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>College admission slip & exam verification</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Barangay residency & voter certificate</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Certificate of indigency & income documents</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-between group-hover:border-primary group-hover:text-primary"
              >
                <span>Select New Applicant Track</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Student Card */}
        <div className="w-full rounded-xl bg-surface-low dark:bg-dark-card border border-slate-border/80 dark:border-dark-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-soft dark:bg-blue-950/60 text-primary dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
              MS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface dark:text-slate-100">{student.name}</span>
                <Badge variant="success" size="sm">Active Profile</Badge>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                {student.school} • {student.program} ({student.yearLevel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Select a track above to enter</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-10 text-left">
          <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border shadow-subtle">
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>Checklist</span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              Track requirements with manual verification controls. No silent status changes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border shadow-subtle">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm mb-1">
              <ScanText className="w-4 h-4" />
              <span>Lumen OCR Scanner</span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              Digitize scans and PDFs, and search inside extracted document text.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-dark-card border border-slate-border dark:border-dark-border shadow-subtle">
            <div className="flex items-center gap-2 text-tertiary font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Grade History</span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              Review and correct extracted grades by term before confirming GWA.
            </p>
          </div>
        </div>
      </main>

      {/* Clean 1-Line Footer */}
      <footer className="w-full border-t border-outline-variant/30 dark:border-dark-border bg-surface-low dark:bg-dark-surface py-4 text-center text-xs text-slate-500 dark:text-slate-400 px-4 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ScholarReady — Pasig City College Scholarship Portal</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Independent student application preparation tool.
          </span>
        </div>
      </footer>
    </div>
  );
}
