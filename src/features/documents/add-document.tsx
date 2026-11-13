"use client";

import { useRef, useState, type FormEvent, type DragEvent } from "react";
import { FileText, UploadCloud, ShieldCheck, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredDocument } from "@/types/shared";
import { uploadError, DOCUMENT_MIME_TYPES } from "@/lib/document-upload";
import { DocumentDialog } from "./document-ui";

export function AddDocument({ onClose, onAdded }: { onClose: () => void; onAdded: (document: StoredDocument, warning?: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function choose(candidate?: File) {
    if (busy || !candidate) return;
    const issue = uploadError(candidate);
    setError(issue ?? "");
    setFile(issue ? null : candidate);
  }
  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length > 1) { setError("Add one document at a time."); return; } choose(event.dataTransfer.files[0]); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !consent || busy) return;
    const issue = uploadError(file);
    if (issue) { setError(issue); return; }
    setBusy(true); setError("");
    try {
      const data = new FormData(); data.set("file", file);
      const response = await fetch("/api/documents", { method: "POST", body: data, signal: AbortSignal.timeout(45000) });
      const payload = await response.json().catch(() => ({}));
      if (payload.document) { onAdded(payload.document, response.ok ? undefined : "Your file was saved, but text extraction could not start. Open it for details."); return; }
      throw new Error(payload.error ?? "We couldn't add your document. Please try again.");
    } catch (reason) { setError(reason instanceof TypeError || (reason instanceof DOMException) ? "The connection was interrupted. Refresh your library before uploading again to avoid duplicates." : reason instanceof Error ? reason.message : "Unable to add document."); }
    finally { setBusy(false); }
  }
  return <DocumentDialog title="Add a document" description="Save your file and make its text searchable." busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <input ref={input} id="document-file" type="file" className="sr-only" tabIndex={-1} accept={DOCUMENT_MIME_TYPES.join(",")} disabled={busy} onChange={(event) => choose(event.target.files?.[0])} />
      {file ? <div className="flex items-center gap-3 rounded-xl border border-slate-border bg-surface-low p-4 dark:border-dark-border dark:bg-dark-cardAlt"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-primary dark:bg-dark-card dark:text-dark-accent"><FileText size={23} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" title={file.name}>{file.name}</p><p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MiB · Ready to upload</p></div><button type="button" disabled={busy} aria-label="Remove selected file" onClick={() => { setFile(null); if (input.current) input.current.value = ""; }} className="grid size-10 place-items-center rounded-lg hover:bg-surface-high disabled:opacity-40 dark:hover:bg-dark-card"><X size={18} /></button></div> : <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} className={`flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${dragging ? "border-primary bg-primary-soft dark:bg-dark-accentSurface" : "border-slate-300 bg-surface hover:border-primary dark:border-dark-border dark:bg-dark-cardAlt"}`}><span className="feature-icon mb-3 !rounded-full" data-tone="purple"><UploadCloud size={24} /></span><span className="text-sm font-semibold">Choose a file or drop it here</span><span className="mt-2 text-xs text-slate-500 dark:text-slate-400">PDF, PNG, JPG, TIFF, or WebP · Up to 10 MiB</span></button>}
      <p className="text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">No category needed. After text extraction, local AI will suggest the document type, tags, and possible checklist matches. You can review or change them at any time.</p>
      <div className="rounded-xl bg-surface p-4 dark:bg-dark-cardAlt"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} className="text-primary dark:text-dark-accent" />Your document, your account</div><p className="text-xs leading-relaxed text-on-surface-variant dark:text-slate-400">The original stays in your library. Lumen OCR processes a copy to extract text for search. Review extracted text before using it for grades or requirements.</p></div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={consent} disabled={busy} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-primary" /><span>I’m authorized to share this document and agree to send it to Lumen for text extraction.</span></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-border pt-4 dark:border-dark-border"><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!file || !consent} isLoading={busy}>{busy ? "Adding document…" : "Add document"}{!busy && <ArrowRight size={16} />}</Button></div>
      {busy && <p role="status" className="text-center text-xs text-slate-500">Keep this window open while your file is being saved.</p>}
    </form>
  </DocumentDialog>;
}
