"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function GradesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="workspace-banner">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-slate-100 tracking-tight">
              Grade History
            </h1>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified Entries
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">
            Academic records grouped by semester. Import OCR text from an OGR or enter manually.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info("Select an OGR document to auto-fill grades")}
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
            <span>Import from OGR</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.info("Opening new subject form...")}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Term</span>
          </Button>
        </div>
      </div>

      <Card className="p-8 border-dashed border-2 border-slate-300 dark:border-dark-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-secondary-soft dark:bg-emerald-950/60 text-secondary flex items-center justify-center mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface dark:text-slate-100">Grade History Workspace</h3>
        <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 1</strong>. Editable tabular rows, GWA compliance checks, and confirmation workflows are documented in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
        </p>
      </Card>
    </div>
  );
}
