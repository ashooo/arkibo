"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Permanent on Desktop, Drawer on Mobile */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 w-full px-4 pt-28 pb-4 sm:px-6 sm:pt-28 sm:pb-6 lg:px-8 lg:pt-28 lg:pb-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
