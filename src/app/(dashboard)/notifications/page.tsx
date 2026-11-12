"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Filter, ExternalLink, ShieldAlert } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              News & Announcements
            </h1>
            <Badge variant="warning" size="sm">Sample / Curated Feed</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Official Pasig scholarship releases, allowance disbursement notices, and SPES opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="w-4 h-4 mr-1.5" />
            <span>Filter Categories</span>
          </Button>
        </div>
      </div>

      <Card className="p-8 border-dashed border-2 border-slate-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-tertiary-soft text-tertiary flex items-center justify-center mb-3">
          <Bell className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">News & Notifications Canvas</h3>
        <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 3</strong>. Announcement cards, source links, honest sample disclaimer pills, and filter chips are specified in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
        </p>
        <div className="flex gap-2">
          <Badge variant="primary" size="sm">Scholarship</Badge>
          <Badge variant="success" size="sm">Allowance</Badge>
          <Badge variant="warning" size="sm">SPES</Badge>
        </div>
      </Card>
    </div>
  );
}
