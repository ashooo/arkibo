"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredDocument } from "@/types/shared";
import { categoryLabel, DocumentStatus } from "./document-ui";

export function DocumentCard({ document, busy, onRemove, onStatus }: { document: StoredDocument; busy: boolean; onRemove: () => void; onStatus: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = `/api/documents/${document.id}/file`;
  const image = ["image/png", "image/jpeg", "image/webp"].includes(document.mimeType);
  const pdf = document.mimeType === "application/pdf";
  return <li className="group overflow-hidden rounded-xl border border-slate-border bg-white transition-shadow hover:shadow-card dark:border-dark-border dark:bg-dark-card">
    <a href={source} target="_blank" rel="noreferrer" aria-label={`Open ${document.originalName}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
      <div aria-hidden="true" className="relative aspect-[4/5] overflow-hidden border-b border-slate-border bg-surface-low dark:border-dark-border dark:bg-dark-bg">
        {image && !imageFailed ? (
          // Thumbnails use the protected account route without Next image optimization.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={source} alt="" loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-contain p-3 transition-transform duration-200 group-hover:scale-[1.02]" />
        ) : pdf ? <iframe src={`${source}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`} title={`Thumbnail of ${document.originalName}`} loading="lazy" tabIndex={-1} className="pointer-events-none h-full w-full border-0 bg-white" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400"><FileText size={64} strokeWidth={1} /><span className="text-xs font-semibold uppercase tracking-wider">{document.mimeType.split("/")[1] || "Document"}</span></div>}
      </div>
      <h2 className="truncate px-4 pt-4 text-sm font-semibold group-hover:text-primary dark:group-hover:text-dark-accent" title={document.originalName}>{document.originalName}</h2>
    </a>
    <div className="space-y-3 px-4 pb-3 pt-2">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400"><FileText size={15} aria-hidden="true" className="shrink-0 text-primary dark:text-dark-accent" /><span className="min-w-0 flex-1 truncate">{categoryLabel(document.category)}</span><button type="button" disabled={busy} onClick={onRemove} aria-label={`Remove ${document.originalName}`} className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 dark:hover:bg-red-950/40"><Trash2 size={15} /></button></div>
      <time dateTime={document.uploadedAt} className="block text-xs text-slate-500 dark:text-slate-400">{new Date(document.uploadedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</time>
      {document.ocrStatus !== "complete" && <div className="flex flex-wrap items-center gap-2 border-t border-slate-border pt-3 dark:border-dark-border"><DocumentStatus status={document.ocrStatus} /><Button variant="ghost" size="sm" disabled={busy} onClick={onStatus}>{busy ? "Working…" : document.ocrStatus === "failed" ? "Retry" : "Check status"}</Button></div>}
    </div>
  </li>;
}
