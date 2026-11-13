"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Megaphone, SquareCheck, File, ChartNoAxesColumnIncreasing, GraduationCap, House, Landmark, LogOut, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { accountRequest } from "@/lib/account";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/student-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/notifications", label: "Announcements", Icon: Megaphone },
  { href: "/checklist", label: "Checklist", Icon: SquareCheck },
  { href: "/documents", label: "My Documents", Icon: File },
  { href: "/grades", label: "Grades", Icon: ChartNoAxesColumnIncreasing },
  { href: "/assistant", label: "Assistant", Icon: MessageCircle },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { student, user, setUser } = useStudent();
  const [signingOut, setSigningOut] = useState(false);
  const links = user?.profile ? navigation : navigation.filter(({ href }) => href === "/notifications");

  async function signOut() {
    setSigningOut(true);
    try {
      await accountRequest("POST", { action: "signout" });
      setUser(null);
      onClose?.();
      router.replace("/account");
    } catch {
      toast.error("Couldn’t sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <>
      {isOpen && <button type="button" tabIndex={-1} aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
      <aside
        id="portal-navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 xl:w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-border bg-surface-lowest dark:border-dark-border dark:bg-dark-surface lg:visible lg:static lg:translate-x-0",
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={(event) => { if (event.key === "Escape") onClose?.(); }}
      >
        <div className="flex h-[4.5rem] items-center justify-between gap-2 border-b border-slate-border px-4 dark:border-dark-border">
          <Link href={user?.profile ? "/dashboard" : "/"} onClick={onClose} className="flex min-h-11 items-center gap-2 text-lg font-semibold">
            <GraduationCap aria-hidden="true" className="text-primary" size={22} />
            ScholarReady
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle className="shrink-0 shadow-none" />
            <button type="button" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-low dark:hover:bg-dark-card lg:hidden" aria-label="Close navigation" onClick={onClose}>
              <X aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
        <nav aria-label="Portal navigation" className="space-y-2 px-3 py-6">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={onClose} aria-current={pathname === href ? "page" : undefined} className={cn(
              "flex min-h-12 items-center gap-4 rounded-xl px-5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              pathname === href ? "bg-primary-soft text-primary-dark dark:bg-dark-accentSurface dark:text-dark-accent" : "hover:bg-surface-low dark:hover:bg-dark-card",
            )}>
              <Icon aria-hidden="true" size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto mx-4 mb-4 space-y-3 border-t border-slate-border pt-4 dark:border-dark-border">
          {user ? (
            <Link href="/account" onClick={onClose} className="flex min-h-16 items-center gap-3 rounded-xl bg-surface-lowest p-2.5 hover:bg-surface-low dark:bg-dark-card dark:hover:bg-dark-cardAlt">
              {user.profile?.photo ? (
                <Image src={user.profile.photo} alt="" width={40} height={40} unoptimized className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white dark:bg-dark-accentSurface dark:text-dark-accent">
                {student.name.trim().split(/\s+/).slice(0, 3).map((part) => part[0]).join("")}
                </span>
              )}
              <span className="min-w-0 border-l border-slate-border pl-3 dark:border-dark-border">
                <span className="block break-words text-sm font-semibold">{student.name}</span>
                <span className="block text-xs text-on-surface-variant dark:text-slate-300">{student.yearLevel}</span>
              </span>
            </Link>
          ) : (
            <Link href="/account" onClick={onClose} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
              Create account or sign in
            </Link>
          )}
          {user?.profile && (
            <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-on-surface-variant dark:text-dark-muted">
              <Landmark aria-hidden="true" className="mt-0.5 shrink-0" size={16} /> {student.school}
            </p>
          )}
          {user && (
            <button type="button" disabled={signingOut} onClick={signOut} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-border px-3 text-sm font-semibold hover:bg-surface-low disabled:opacity-50 dark:border-dark-border dark:hover:bg-dark-card">
              <LogOut aria-hidden="true" size={18} /> Log out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
