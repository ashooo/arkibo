"use client";

import { ChevronDown } from "lucide-react";
import { ScholarMascot } from "@/components/ui/scholar-mascot";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FolderOpen, Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredDocument } from "@/types/shared";
import { AddDocument } from "./add-document";
import { categories, DocumentDialog, inputStyle } from "./document-ui";
import { DocumentCard } from "./document-card";
import { ClassificationReview } from "./classification-review";

type SearchResult = StoredDocument;
export function DocumentLibrary({ initialAddOpen = false, initialReviewId }: { initialAddOpen?: boolean; initialReviewId?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [documents, setDocuments] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [addOpen, setAddOpen] = useState(initialAddOpen);
  const [reviewId, setReviewId] = useState<string | null>(initialReviewId ?? null);
  const [deleting, setDeleting] = useState<SearchResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const attempts = useRef(new Map<string, number>());
  function upsert(record: StoredDocument) {
    setDocuments((current) => current.some((entry) => entry.id === record.id) ? current.map((entry) => entry.id === record.id ? { ...entry, ...record } : entry) : [{ ...record }, ...current]);
  }
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      void fetch(`/api/documents${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load your documents.");
        if (!controller.signal.aborted) setDocuments(data.documents ?? []);
      }).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message || "Unable to connect. Please try again."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, query ? 350 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, revision]);

  const pendingKey = documents.filter((entry) => entry.ocrStatus === "pending").map((entry) => entry.id).sort().join(",");
  useEffect(() => {
    if (!pendingKey) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (controller.signal.aborted) return;
      if (!window.document.hidden) {
        const ids = pendingKey.split(",").filter((id) => (attempts.current.get(id) ?? 0) < 10).slice(0, 3);
        await Promise.all(ids.map(async (id) => {
          attempts.current.set(id, (attempts.current.get(id) ?? 0) + 1);
          try {
            const response = await fetch(`/api/documents/${id}/ocr`, { method: "POST", signal: controller.signal });
            const data = await response.json();
            if (controller.signal.aborted) return;
            if (!response.ok || !data.document) { attempts.current.set(id, 10); setError(data.error ?? "Couldn't check text extraction. Use Check status to try again."); return; }
            upsert(data.document);
          } catch { if (!controller.signal.aborted) { attempts.current.set(id, 10); setError("Status checks paused after a connection problem. You can check again manually."); } }
        }));
      }
      if (!controller.signal.aborted) timer = setTimeout(() => void poll(), 6000);
    }
    timer = setTimeout(() => void poll(), 3000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [pendingKey]);

  const classificationKey = documents.filter((entry) => entry.ocrStatus === "complete" && ["pending", "processing"].includes(entry.classificationStatus)).map((entry) => entry.id).sort().join(",");
  useEffect(() => {
    if (!classificationKey) return;
    const controller = new AbortController();
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (controller.signal.aborted || attempts++ >= 70) return;
      if (!window.document.hidden) await Promise.all(classificationKey.split(",").slice(0, 5).map(async (id) => {
        try {
          const response = await fetch(`/api/documents/${id}`, { signal: controller.signal, cache: "no-store" });
          const data = await response.json();
          if (response.ok && data.document && !controller.signal.aborted) upsert(data.document);
        } catch { /* The manual review action remains available after a network interruption. */ }
      }));
      if (!controller.signal.aborted) timer = setTimeout(() => void poll(), 3000);
    }
    timer = setTimeout(() => void poll(), 1500);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [classificationKey]);

  async function action(record: SearchResult, retry: boolean) {
    if (busyId) return;
    setBusyId(record.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/documents/${record.id}/ocr${retry ? "/retry" : ""}`, { method: "POST", signal: AbortSignal.timeout(40000) });
      const data = await response.json();
      if (!response.ok || !data.document) throw new Error(data.error ?? "Unable to process this document.");
      attempts.current.set(record.id, 0); upsert(data.document);
      if (data.document.ocrStatus === "pending") setNotice("Your original is saved. Text extraction is still processing; you can return to this page later.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Connection interrupted. Please try again."); }
    finally { setBusyId(null); }
  }
  async function remove() {
    if (!deleting || busyId) return;
    setBusyId(deleting.id); setError("");
    try {
      const response = await fetch(`/api/documents/${deleting.id}`, { method: "DELETE", signal: AbortSignal.timeout(15000) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "Unable to remove document."); }
      setDocuments((current) => current.filter((entry) => entry.id !== deleting.id));
      setDeleting(null); setNotice("Document removed from your library.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove document."); setDeleting(null); }
    finally { setBusyId(null); }
  }
  function closeAdd() { setAddOpen(false); if (initialAddOpen) router.replace("/documents", { scroll: false }); }
  const visible = documents.filter((entry) => !category || entry.category === category);
  return <section className="space-y-6 pb-8">
    <header className="workspace-banner"><div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary dark:text-dark-accent">Scholarship workspace</p><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My Documents</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">Your originals, organized and easy to find. Add a document to extract its text for search, requirements, and grade review.</p></div><Button onClick={() => setAddOpen(true)} className="min-h-11 shrink-0"><Plus size={18} />Add document</Button></header>
    <div className="rounded-2xl border border-slate-border bg-white dark:border-dark-border dark:bg-dark-card">
      <div className="flex flex-col gap-3 border-b border-slate-border p-4 dark:border-dark-border sm:flex-row sm:items-center sm:p-5"><div className="relative min-w-0 flex-1"><Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input aria-label="Search documents" placeholder="Search a name, COR, OGR, or words inside a document…" className={`${inputStyle} pl-10 pr-10`} value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" className="absolute right-1 top-1 grid size-9 place-items-center rounded-md text-slate-500 hover:bg-surface-low dark:hover:bg-dark-cardAlt" onClick={() => setQuery("")}><X size={16} /></button>}</div><div className="relative min-w-0 sm:w-48 sm:shrink-0"><select aria-label="Filter by document category" className={`${inputStyle} appearance-none truncate pr-10`} value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" /></div><Button variant="secondary" className="min-h-11 shrink-0" aria-label="Refresh documents" disabled={loading} onClick={() => setRevision((value) => value + 1)}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /><span className="sm:sr-only">Refresh</span></Button></div>
      {error && <div role="alert" className="m-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><X size={17} /></button></div>}
      {notice && <p role="status" className="mx-5 mt-4 rounded-lg bg-primary-soft p-3 text-sm text-primary-dark dark:bg-dark-accentSurface dark:text-dark-accent">{notice}</p>}
      <div aria-live="polite" aria-busy={loading}>
        {loading && !documents.length ? <div className="space-y-4 p-5" role="status"><span className="sr-only">Loading documents</span>{[0, 1, 2].map((id) => <div key={id} className="h-28 animate-pulse rounded-xl bg-surface-low dark:bg-dark-cardAlt" />)}</div> : !visible.length ? <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-14 text-center">{query || category ? <span className="feature-icon mb-5" data-tone="purple"><FolderOpen size={30} /></span> : <ScholarMascot size={96} className="mb-5" />}<h2 className="text-xl font-bold sm:text-2xl">{query || category ? "No matching documents" : "A home for your scholarship documents"}</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">{query || category ? "Try a different search or category. Extracted text becomes searchable once processing is complete." : "Add enrollment proofs, grade reports, and IDs. Keep the original and find it later by the words inside."}</p><Button variant={query || category ? "secondary" : "primary"} className="mt-5 min-h-11" onClick={() => { if (query || category) { setQuery(""); setCategory(""); } else setAddOpen(true); }}>{query || category ? "Clear filters" : <><Plus size={17} />Add your first document</>}</Button></div> : <ul aria-label="Documents" className={`grid gap-5 p-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))] sm:p-5 ${loading ? "opacity-60" : ""}`}>{visible.map((record) => <DocumentCard key={record.id} document={record} onReview={() => setReviewId(record.id)} busy={!!busyId} onRemove={() => setDeleting(record)} onStatus={() => void action(record, record.ocrStatus === "failed")} />)}</ul>}
      </div>
      {!loading && visible.length > 0 && <p className="border-t border-slate-border px-5 py-3 text-xs text-slate-500 dark:border-dark-border">Showing {visible.length} {visible.length === 1 ? "document" : "documents"}{documents.length === 50 ? " from your 50 most recent matches" : ""}. Originals remain available while text is processing.</p>}
    </div>
    {addOpen && <AddDocument onClose={closeAdd} onAdded={(record, warning) => { upsert(record); setQuery(""); setCategory(""); setNotice(warning ?? "Document added. Text extraction is processing in the background."); closeAdd(); setRevision((value) => value + 1); }} />}
    {reviewId && <ClassificationReview documentId={reviewId} onUpdated={upsert} onClose={() => { setReviewId(null); if (initialReviewId) router.replace("/documents", { scroll: false }); }} />}
    {deleting && <DocumentDialog title="Remove this document?" onClose={() => setDeleting(null)} busy={!!busyId}><div className="space-y-5 p-6"><p className="break-words text-sm"><strong>{deleting.originalName}</strong> will be removed from your library and detached from checklist items. This cannot be undone.</p><p className="text-xs text-slate-500">This removes the local file. Any copy already sent to Lumen is subject to its retention policy.</p><div className="flex justify-end gap-3"><Button variant="secondary" disabled={!!busyId} onClick={() => setDeleting(null)}>Keep document</Button><Button variant="danger" isLoading={!!busyId} onClick={() => void remove()}>Remove document</Button></div></div></DocumentDialog>}
  </section>;
}
