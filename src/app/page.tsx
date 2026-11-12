"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, GraduationCap } from "lucide-react";
import { useStudent, type ApplicationType } from "@/lib/student-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const tracks = [
  { type: "renewal", title: "Renewal Scholar", description: "Prepare your documents for scholarship renewal.", Icon: GraduationCap, tone: "green" },
  { type: "new", title: "New Applicant", description: "Find and organize your first application requirements.", Icon: ClipboardList, tone: "blue" },
] as const;

export default function OnboardingLandingPage() {
  const router = useRouter();
  const { setApplicationType } = useStudent();

  function selectTrack(type: ApplicationType) {
    setApplicationType(type);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-surface dark:bg-dark-bg">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-border bg-white px-4 py-2 dark:border-dark-border dark:bg-dark-surface sm:px-8">
        <span className="flex items-center gap-2 text-lg font-semibold"><GraduationCap aria-hidden="true" className="text-primary" size={24} />ScholarReady</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-soft dark:hover:bg-dark-accentSurface">Open portal <ArrowRight aria-hidden="true" size={16} /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-7 px-4 py-10 sm:px-8 sm:py-16">
        <div className="workspace-banner">
          <div>
            <h1 className="text-3xl font-normal tracking-tight">Pasig College Scholar Portal</h1>
            <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-300">Choose your application track to get started.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {tracks.map(({ type, title, description, Icon, tone }) => (
            <button type="button" key={type} className="workspace-card text-left" onClick={() => selectTrack(type)}>
              <span className="workspace-cover" data-tone={tone}>
                <span className="text-xl font-semibold">{title}</span><Icon aria-hidden="true" size={30} />
              </span>
              <span className="flex items-start justify-between gap-3 p-4 text-sm text-on-surface-variant dark:text-slate-300">
                {description}<ArrowRight aria-hidden="true" size={17} className="shrink-0 text-primary" />
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
