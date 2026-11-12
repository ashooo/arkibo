"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, FolderArchive, GraduationCap, House, ScanText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/student-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/notifications", label: "Announcements", Icon: Bell },
  { href: "/checklist", label: "Checklist", Icon: ClipboardList },
  { href: "/scanner", label: "Scanner & OCR", Icon: ScanText },
  { href: "/documents", label: "My Documents", Icon: FolderArchive },
  { href: "/grades", label: "Grades", Icon: GraduationCap },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { student, applicationType, toggleApplicationType } = useStudent();
  return (
    <>
      {isOpen && <button type="button" tabIndex={-1} aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />}
      <aside
        id="portal-navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-border bg-white dark:border-dark-border dark:bg-dark-surface lg:visible lg:static lg:translate-x-0",
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={(event) => { if (event.key === "Escape") onClose?.(); }}
      >
        <div className="flex h-[4.5rem] items-center justify-between gap-2 border-b border-slate-border px-4 dark:border-dark-border">
          <Link href="/dashboard" onClick={onClose} className="flex min-h-11 items-center gap-2 text-lg font-semibold">
            <GraduationCap aria-hidden="true" className="text-primary" size={22} />
            ScholarReady
          </Link>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-dark-card lg:hidden" aria-label="Close navigation" onClick={onClose}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <nav aria-label="Portal navigation" className="space-y-1 py-3 pr-3">
          {navigation.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={onClose} aria-current={pathname === href ? "page" : undefined} className={cn(
              "flex min-h-12 items-center gap-4 rounded-r-full px-5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              pathname === href ? "bg-primary-soft text-primary-dark dark:bg-dark-accentSurface dark:text-dark-accent" : "hover:bg-surface-low dark:hover:bg-dark-card",
            )}>
              <Icon aria-hidden="true" size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-slate-border p-4 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-dark dark:bg-dark-accentSurface">
              {student.name.split(" ").map((part) => part[0]).join("")}
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{student.name}</p>
              <p className="text-xs text-on-surface-variant dark:text-slate-300">{student.yearLevel}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-300">{student.school}</p>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={toggleApplicationType} aria-label="Switch application track" className="min-h-11 rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary-soft dark:hover:bg-dark-accentSurface">
              {applicationType === "renewal" ? "Renewal Scholar" : "New Applicant"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
