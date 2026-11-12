"use client";

import { useStudent } from "@/lib/student-context";
import { WorkspaceGrid } from "@/components/layout/workspace-grid";
import { AccountWorkspace } from "@/features/account-workspace";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { applicationType } = useStudent();
  return <AccountWorkspace><DashboardWorkspace key={applicationType} /></AccountWorkspace>;
}

type Summary = { checklist: { total: number; prepared: number; deadline: string }; documents: { total: number; complete: number; pending: number; failed: number }; grades: { total: number; verified: number } };
function DashboardWorkspace() {
  const { applicationType } = useStudent();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch(`/api/workspace/summary?type=${applicationType}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load progress.");
      if (active) setSummary(data);
    }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [applicationType]);

  return <section className="flex flex-col gap-6">
    <header className="workspace-banner">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Home</h1>
        <p className="text-sm text-on-surface-variant dark:text-slate-400">
          {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}
        </p>
      </div>
    </header>
    {summary ? <div className="grid gap-4 sm:grid-cols-3">
      <Link href="/checklist" className="rounded-2xl border border-slate-border bg-white p-5 dark:bg-dark-card dark:border-dark-border"><h2 className="font-semibold">Checklist</h2><p className="mt-2 text-2xl font-bold">{summary.checklist.prepared} / {summary.checklist.total} prepared</p><p className="text-sm text-slate-500">{summary.checklist.deadline ? `Your deadline: ${summary.checklist.deadline}` : "No deadline set"}</p></Link>
      <Link href="/documents" className="rounded-2xl border border-slate-border bg-white p-5 dark:bg-dark-card dark:border-dark-border"><h2 className="font-semibold">Documents</h2><p className="mt-2 text-2xl font-bold">{summary.documents.total} saved</p><p className="text-sm text-slate-500">{summary.documents.complete} scanned · {summary.documents.pending} pending · {summary.documents.failed} failed</p></Link>
      <Link href="/grades" className="rounded-2xl border border-slate-border bg-white p-5 dark:bg-dark-card dark:border-dark-border"><h2 className="font-semibold">Grades</h2><p className="mt-2 text-2xl font-bold">{summary.grades.verified} / {summary.grades.total} verified</p><p className="text-sm text-slate-500">Review OCR suggestions before verification</p></Link>
    </div> : <p role="status">{error || "Loading your progress…"}</p>}
    <WorkspaceGrid />
  </section>;
}
