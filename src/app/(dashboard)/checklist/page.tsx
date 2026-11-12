"use client";

import React from "react";
import { useStudent } from "@/lib/student-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Upload, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChecklistPage() {
  const { applicationType } = useStudent();
  const isRenewal = applicationType === "renewal";

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-slate-100 tracking-tight">
              Scholarship Checklist
            </h1>
            <Badge variant="primary" size="sm">
              {isRenewal ? "Renewal Track" : "New Applicant Track"}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">
            Track required documents and attach verified scans from your library.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info("Filter applied: Showing all requirements")}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            <span>Filter</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.info("Opening document selector...")}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Attach Document</span>
          </Button>
        </div>
      </div>

      {/* Feature Container for Dev 2 */}
      <Card className="p-8 border-dashed border-2 border-slate-300 dark:border-dark-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-primary-soft dark:bg-blue-950/60 text-primary dark:text-blue-300 flex items-center justify-center mb-3">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface dark:text-slate-100">Checklist Workspace</h3>
        <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 2</strong>. Component specifications and status badges are documented in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="neutral" size="sm">missing</Badge>
          <Badge variant="primary" size="sm">uploaded</Badge>
          <Badge variant="success" size="sm">prepared</Badge>
          <Badge variant="warning" size="sm">needs_attention</Badge>
        </div>
      </Card>
    </div>
  );
}
