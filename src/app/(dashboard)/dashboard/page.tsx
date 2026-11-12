"use client";

import { useStudent } from "@/lib/student-context";
import { WorkspaceGrid } from "@/components/layout/workspace-grid";

export default function DashboardPage() {
  const { applicationType } = useStudent();

  return <section className="space-y-6">
    <header>
      <h1 className="text-3xl font-normal tracking-tight">Home</h1>
      <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-300">
        {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}
      </p>
    </header>
    <WorkspaceGrid />
  </section>;
}
