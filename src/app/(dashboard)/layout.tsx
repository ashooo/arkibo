"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStudent } from "@/lib/student-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user, accountLoading } = useStudent();
  const requiresProfile = pathname !== "/notifications";

  useEffect(() => {
    if (requiresProfile && !accountLoading && !user?.profile) router.replace("/account");
  }, [requiresProfile, accountLoading, user, router]);

  if (requiresProfile && (accountLoading || !user?.profile)) {
    return <p role="status" className="p-6">{accountLoading ? "Checking your session…" : "Opening your account…"}</p>;
  }

  return (
    <div className="portal-frame flex bg-surface dark:bg-dark-bg">
      {/* Permanent on Desktop, Drawer on Mobile */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <button type="button" className="mb-3 grid h-11 w-11 place-items-center rounded-full hover:bg-surface-low dark:hover:bg-dark-card lg:hidden" aria-label="Open navigation" aria-controls="portal-navigation" aria-expanded={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(true)}>
              <Menu aria-hidden="true" size={22} />
            </button>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
