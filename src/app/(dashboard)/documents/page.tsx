"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderArchive, Upload, Filter } from "lucide-react";
import { toast } from "sonner";

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="workspace-banner">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-slate-100 tracking-tight">
              My Documents
            </h1>
            <Badge variant="neutral" size="sm">Shared Library</Badge>
          </div>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">
            Saved originals, categories, and extracted searchable OCR text.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info("Filter by category: All")}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            <span>Category</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.info("Select a file to add to My Documents")}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Upload New</span>
          </Button>
        </div>
      </div>

      <Card className="p-8 border-dashed border-2 border-slate-300 dark:border-dark-border text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-primary-soft dark:bg-dark-accentSurface text-primary dark:text-dark-accent flex items-center justify-center mb-3">
          <FolderArchive className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-on-surface dark:text-slate-100">Documents Library Workspace</h3>
        <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">
          Assigned to <strong>Developer 1</strong>. Grid card layouts, categories, and full-text search are documented in <code className="text-primary font-mono font-bold">DESIGN.md</code>.
        </p>
      </Card>
    </div>
  );
}
