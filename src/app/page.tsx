"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudent, ApplicationType } from "@/lib/student-context";
import {
  GraduationCap,
  FileCheck2,
  ScanText,
  Search,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OnboardingLandingPage() {
  const router = useRouter();
  const { applicationType, setApplicationType, student } = useStudent();

  const handleSelectTrack = (type: ApplicationType) => {
    setApplicationType(type);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Top Civic Navigation */}
      <header className="w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg shadow-sm">
              SR
            </div>
            <div>
              <span className="font-bold text-xl text-primary tracking-tight">
                ScholarReady
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-slate-muted bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Pasig City Student Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Enter Portal Demo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Track Selection */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center">
        {/* SDG & Civic Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-soft text-emerald-800 text-xs font-semibold border border-emerald-200/80 mb-6 shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>SDG 4: Quality Education • OVERCLOCK 2026</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            Preparing Pasig Scholars for <span className="text-primary">Success & Renewal</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-on-surface-variant leading-relaxed">
            An independent preparation gateway for college scholars in Pasig City.
            Organize requirements, read documents with <strong>Lumen OCR</strong>, and track your verified grades.
          </p>
        </div>

        {/* Track Selection Cards (Branch 3) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Renewal Track */}
          <div
            onClick={() => handleSelectTrack("renewal")}
            className="cursor-pointer group relative rounded-2xl bg-white border-2 border-primary/20 hover:border-primary p-6 sm:p-8 transition-all hover:shadow-card flex flex-col justify-between"
          >
            <div className="absolute -top-3 right-6">
              <Badge variant="success" size="sm" className="shadow-sm">
                Recommended for Continuing Scholars
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-soft text-secondary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">
                Renewal Scholar
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                For continuing tertiary scholars maintaining their scholarship. Manage semestral renewal packets, verify OGR grades, and submit proof of enrollment.
              </p>

              <div className="mt-6 space-y-2 border-t border-slate-border/50 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-body font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Official Grade Report (OGR) verification</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-body font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Certificate of Registration (COR) matching</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-body font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Term GWA compliance checker (≤ 2.00)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-between group-hover:bg-primary-light"
              >
                <span>Enter as Renewal Scholar</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* New Applicant Track */}
          <div
            onClick={() => handleSelectTrack("new")}
            className="cursor-pointer group relative rounded-2xl bg-white border border-slate-border hover:border-primary/60 p-6 sm:p-8 transition-all hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div className="h-6 w-6 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-primary transition-colors">
                  <div className="h-3 w-3 rounded-full bg-transparent group-hover:bg-primary/50 transition-colors" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">
                New Applicant
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                For incoming college freshmen or first-time applicants submitting initial documentation to the Pasig City education department.
              </p>

              <div className="mt-6 space-y-2 border-t border-slate-border/50 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-body font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Admission slip & entrance test verification</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-body font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Barangay certificate of residency & voter's ID</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-body font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Certificate of indigency / ITR documentation</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-between group-hover:border-primary group-hover:text-primary"
              >
                <span>Enter as New Applicant</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Profile Confirmation Card */}
        <div className="w-full rounded-xl bg-surface-container-low border border-slate-border/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm shrink-0">
              MS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface">{student.name}</span>
                <Badge variant="success" size="sm">Active Demo Profile</Badge>
              </div>
              <p className="text-xs text-on-surface-variant">
                {student.school} • {student.program} ({student.yearLevel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-muted">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Click any track above to enter the portal</span>
          </div>
        </div>

        {/* Feature Overview Strip */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-border shadow-subtle">
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>Independent Checklist</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Track packet requirements with manual verification controls. No silent status changes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-border shadow-subtle">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm mb-1">
              <ScanText className="w-4 h-4" />
              <span>Lumen OCR Scanner</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Digitize scans and PDFs. Search inside extracted text using PostgreSQL keywords.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-border shadow-subtle">
            <div className="flex items-center gap-2 text-tertiary font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Verified Grade History</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Review and correct AI-extracted grades by semester. Confirm GWA compliance with confidence.
            </p>
          </div>
        </div>
      </main>

      {/* Civic Footer & Disclaimer */}
      <footer className="w-full border-t border-outline-variant/30 bg-surface-low py-6 text-center text-xs text-slate-muted px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <span>OVERCLOCK 2026</span>
            <span>•</span>
            <span>Team ASCII</span>
            <span>•</span>
            <span>SDG 4: Quality Education</span>
            <span>•</span>
            <span>Pasig City Tertiary Education</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Disclaimer: ScholarReady is an independent hackathon prototype. No formal affiliation or endorsement by the Pasig City Government or City Education Department is claimed.
          </p>
        </div>
      </footer>
    </div>
  );
}
