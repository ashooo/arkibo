"use client";

import { useStudent } from "@/lib/student-context";
import { ScholarMascot } from "@/components/ui/scholar-mascot";
import { WorkspaceGrid } from "@/components/layout/workspace-grid";
import { AccountWorkspace } from "@/features/account-workspace";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartNoAxesColumnIncreasing, File, SquareCheck } from "lucide-react";

export default function DashboardPage() {
  const { user } = useStudent();
  return <AccountWorkspace><DashboardWorkspace key={user?.id} /></AccountWorkspace>;
}

type Summary = { checklist: { total: number; prepared: number; deadline: string }; documents: { total: number; complete: number; pending: number; failed: number }; grades: { total: number; verified: number } };
function DashboardWorkspace() {
  const { student } = useStudent();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/workspace/summary", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load progress.");
      if (active) setSummary(data);
    }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);

  return <section className="flex flex-col gap-6">
    <header className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 space-y-2 break-words">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Welcome, {student.name.split(/\s+/)[0]}</h1>
        <p className="text-sm text-on-surface-variant dark:text-slate-400">
          Your applications and scholarship progress
        </p>
      </div>
      <ScholarMascot size={80} />
    </header>
    {summary ? <div className="grid gap-4 sm:grid-cols-3">
      <Link href="/checklist" className="rounded-2xl border border-slate-border bg-white p-5 dark:bg-dark-card dark:border-dark-border"><span className="feature-icon mb-3" data-tone="green"><SquareCheck aria-hidden="true" /></span><h2 className="font-semibold">Checklist</h2><p className="mt-2 text-2xl font-bold">{summary.checklist.prepared} / {summary.checklist.total} prepared</p><p className="text-sm text-on-surface-variant dark:text-slate-300">{summary.checklist.deadline ? `Your deadline: ${summary.checklist.deadline}` : "No deadline set"}</p></Link>
      <Link href="/documents" className="rounded-2xl border border-slate-border bg-white p-5 dark:bg-dark-card dark:border-dark-border"><span className="feature-icon mb-3" data-tone="purple"><File aria-hidden="true" /></span><h2 className="font-semibold">Documents</h2><p className="mt-2 text-2xl font-bold">{summary.documents.total} saved</p><p className="text-sm text-on-surface-variant dark:text-slate-300">{summary.documents.complete} scanned · {summary.documents.pending} pending · {summary.documents.failed} failed</p></Link>
      <Link href="/grades" className="rounded-2xl border border-slate-border bg-white p-5 dark:bg-dark-card dark:border-dark-border"><span className="feature-icon mb-3" data-tone="gold"><ChartNoAxesColumnIncreasing aria-hidden="true" /></span><h2 className="font-semibold">Grades</h2><p className="mt-2 text-2xl font-bold">{summary.grades.verified} / {summary.grades.total} verified</p><p className="text-sm text-on-surface-variant dark:text-slate-300">Review OCR suggestions before verification</p></Link>
    </div> : <p role="status">{error || "Loading your progress…"}</p>}
    <WorkspaceGrid />
  </section>;
}
