"use client";

import React from "react";
import { useStudent } from "@/lib/student-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Upload, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChecklistPage() {
  const { applicationType } = useStudent();
  const isRenewal = applicationType === "renewal";

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Scholarship Checklist
            </h1>
            <Badge variant="primary" size="sm">
              {isRenewal ? "Renewal Track" : "New Applicant Track"}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Track missing, uploaded, and prepared requirements. Select a document from your library to attach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="w-4 h-4 mr-1.5" />
            <span>Filter Status</span>
          </Button>
          <Button variant="primary" size="sm">
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Attach Document</span>
          </Button>
        </div>
      </div>

      {/* Feature Container for Dev 2 */}
      <Card className="p-8 border-dashed border-2 border-slate-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Checklist Feature Canvas</h3>
        <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 2</strong>. Component specifications, status badges, and attachment picker patterns are documented in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
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
