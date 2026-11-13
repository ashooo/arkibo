"use client";

import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import type { StoredDocument } from "@/types/shared";
import { DocumentDialog, inputStyle } from "@/features/documents/document-ui";
import { categoryLabel } from "@/features/documents/document-ui";

export type ChatDocument = Pick<StoredDocument, "id" | "originalName" | "ocrStatus">;
export function ChatDocumentPicker({ selectedIds, onSelect, onClose }: { selectedIds: string[]; onSelect: (document: ChatDocument) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      void fetch(`/api/documents?q=${encodeURIComponent(query)}`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load documents.");
        if (!controller.signal.aborted) setRecords(data.documents ?? []);
      }).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, query ? 300 : 0);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query]);
  return <DocumentDialog title="Attach a saved document" description="Choose a file from My Documents. No new upload or OCR submission is needed." onClose={onClose}>
    <div className="space-y-4 p-5 sm:p-6">
      <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input autoFocus aria-label="Search saved documents" className={`${inputStyle} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents…" /></div>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {loading ? <p role="status" className="py-6 text-center text-sm text-slate-500">Loading documents…</p> : !records.length ? <p className="py-6 text-center text-sm text-slate-500">No documents found. Try another search or upload a new file.</p> : <ul className="max-h-80 space-y-2 overflow-y-auto">{records.map((record) => <li key={record.id}><button type="button" disabled={selectedIds.includes(record.id)} onClick={() => { onSelect(record); onClose(); }} className="flex w-full items-center gap-3 rounded-xl border border-slate-border p-3 text-left hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 dark:border-dark-border dark:hover:bg-dark-cardAlt"><FileText size={21} className="shrink-0 text-primary dark:text-dark-accent" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{record.originalName}</span><span className="text-xs text-slate-500">{selectedIds.includes(record.id) ? "Already attached" : `${categoryLabel(record.category)} · ${record.ocrStatus === "complete" ? "Ready to read" : record.ocrStatus === "pending" ? "Text processing" : "Needs attention"}`}</span></span></button></li>)}</ul>}
    </div>
  </DocumentDialog>;
}
