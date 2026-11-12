"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const workspaceTabs = [
  ["/notifications", "Stream"],
  ["/checklist", "Checklist"],
  ["/scanner", "Scanner"],
  ["/documents", "Documents"],
  ["/grades", "Grades"],
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="portal-frame flex bg-surface dark:bg-dark-bg">
      {/* Permanent on Desktop, Drawer on Mobile */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        {workspaceTabs.some(([href]) => href === pathname) && (
          <nav aria-label="Scholarship workspace" className="flex shrink-0 overflow-x-auto border-b border-slate-border bg-white px-2 dark:border-dark-border dark:bg-dark-surface sm:px-6">
            {workspaceTabs.map(([href, label]) => (
              <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="inline-flex min-h-12 shrink-0 items-center border-b-2 border-transparent px-4 text-sm font-medium hover:bg-surface-low focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=page]:border-primary aria-[current=page]:text-primary dark:hover:bg-dark-card">
                {label}
              </Link>
            ))}
          </nav>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
