"use client";

import { useStudent } from "@/lib/student-context";
import { WorkspaceGrid } from "@/components/layout/workspace-grid";

export default function DashboardPage() {
  const { applicationType } = useStudent();

  return <section className="flex flex-col gap-6">
    <header className="workspace-banner">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Home</h1>
        <p className="text-sm text-on-surface-variant dark:text-slate-400">
          {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}
        </p>
      </div>
    </header>
    <WorkspaceGrid />
  </section>;
}
