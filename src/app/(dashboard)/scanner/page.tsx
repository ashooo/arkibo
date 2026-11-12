"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanText, UploadCloud, Search, Sparkles } from "lucide-react";

export default function ScannerPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Document Scanner & OCR
            </h1>
            <Badge variant="primary" size="sm">
              <Sparkles className="w-3 h-3 mr-1 text-primary" />
              Lumen OCR
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Upload document images (JPG, PNG) or PDFs to extract searchable text via the real Lumen OCR API.
          </p>
        </div>
      </div>

      {/* Feature Container for Dev 1 */}
      <Card className="p-8 border-dashed border-2 border-slate-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3">
          <ScanText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">OCR Scanner & Split-Screen View</h3>
        <p className="text-xs text-on-surface-variant max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 1</strong>. Two-column split layout (50% original preview, 50% searchable text editor) is specified in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
        </p>
        <div className="flex gap-2">
          <Badge variant="neutral" size="sm">pending</Badge>
          <Badge variant="success" size="sm">complete</Badge>
          <Badge variant="error" size="sm">failed</Badge>
        </div>
      </Card>
    </div>
  );
}
