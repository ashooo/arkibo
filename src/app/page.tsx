"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardList, GraduationCap } from "lucide-react";
import { useStudent } from "@/lib/student-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function OnboardingLandingPage() {
  const { user, accountLoading } = useStudent();
  const destination = user?.profile ? "/dashboard" : "/account";

  return (
    <div className="public-scene min-h-dvh bg-surface dark:bg-dark-bg">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-border bg-surface-lowest px-4 py-2 dark:border-dark-border dark:bg-dark-surface sm:px-8">
        <span className="flex items-center gap-2 text-lg font-semibold"><Image src="/arkibo-logo.svg" alt="" width={36} height={36} className="shrink-0 dark:brightness-0 dark:invert" /><span>Arkibo</span></span>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="text-sm font-semibold text-primary hover:underline">Announcements</Link>
          <Link href={destination} className="text-sm font-semibold text-primary hover:underline">{user ? "Profile" : "Sign in or create an account"}</Link>
          <ThemeToggle />
          {user?.profile && <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-soft dark:hover:bg-dark-accentSurface">Open portal <ArrowRight aria-hidden="true" size={16} /></Link>}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-primary px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
          <div className="relative z-10 max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold"><ClipboardList size={16} /> Your scholarship workspace</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Arkibo Scholarship Portal</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg">Create a checklist for each opportunity, set its deadline, and keep requirements, notes, and documents together.</p>
            <Link href={destination} aria-disabled={accountLoading} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-blue-50 aria-disabled:pointer-events-none aria-disabled:opacity-60">{user?.profile ? "Open your workspace" : "Get started"}<ArrowRight size={17} /></Link>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 hidden size-96 rounded-full border-[36px] border-white/10 sm:block" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-24 hidden size-60 rounded-full bg-cyan-300/10 blur-2xl sm:block" />
        </section>
      </main>
    </div>
  );
}
