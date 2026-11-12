"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus, Sparkles, CheckCircle2 } from "lucide-react";

export default function GradesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Grade History
            </h1>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified Entries
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Academic records organized by semester. Import OCR text from an OGR or enter subjects manually.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
            <span>Import from OGR</span>
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Term / Subject</span>
          </Button>
        </div>
      </div>

      <Card className="p-8 border-dashed border-2 border-slate-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-secondary-soft text-secondary flex items-center justify-center mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Editable Academic Grade Canvas</h3>
        <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 1</strong>. Editable tabular rows, GWA calculation badge, and student confirmation controls are documented in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
        </p>
      </Card>
    </div>
  );
}
