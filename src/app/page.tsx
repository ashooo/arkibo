"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, GraduationCap } from "lucide-react";
import { useStudent, type ApplicationType } from "@/lib/student-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const tracks = [
  { type: "renewal", title: "Renewal Scholar", description: "Prepare your documents for scholarship renewal.", Icon: GraduationCap, tone: "green" },
  { type: "new", title: "New Applicant", description: "Find and organize your first application requirements.", Icon: ClipboardList, tone: "gold" },
] as const;

export default function OnboardingLandingPage() {
  const router = useRouter();
  const { setApplicationType, user, accountLoading } = useStudent();

  function selectTrack(type: ApplicationType) {
    if (!user?.profile) {
      router.push("/account");
      return;
    }
    setApplicationType(type);
    router.push("/dashboard");
  }

  return (
    <div className="public-scene min-h-dvh bg-surface dark:bg-dark-bg">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-border bg-surface-lowest px-4 py-2 dark:border-dark-border dark:bg-dark-surface sm:px-8">
        <span className="flex items-center gap-2 text-lg font-semibold"><GraduationCap aria-hidden="true" className="text-primary" size={24} /><span>Scholar<span className="text-primary">Ready</span></span></span>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="text-sm font-semibold text-primary hover:underline">Announcements</Link>
          <Link href="/account" className="text-sm font-semibold text-primary hover:underline">{user ? "Profile" : "Sign in or create an account"}</Link>
          <ThemeToggle />
          {user?.profile && <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-soft dark:hover:bg-dark-accentSurface">Open portal <ArrowRight aria-hidden="true" size={16} /></Link>}
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-7 px-4 py-10 sm:px-8 sm:py-20">
        <div className="workspace-banner flex-row items-center">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">Pasig College Scholar Portal</h1>
            <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-300">Choose your application track to get started.</p>
          </div>
          <Image
            src="/scholarready-owl.webp"
            alt=""
            width={160}
            height={160}
            className="scholar-mascot h-20 w-20 shrink-0 object-contain sm:h-28 sm:w-28"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {tracks.map(({ type, title, description, Icon, tone }) => (
            <button type="button" disabled={accountLoading} key={type} className="feature-tile text-left" data-tone={tone} onClick={() => selectTrack(type)}>
              <span className="feature-icon"><Icon aria-hidden="true" size={28} /></span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold">{title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-on-surface-variant dark:text-slate-300">{description}</span>
              </span>
              <span className="feature-arrow"><ArrowRight aria-hidden="true" size={20} /></span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
