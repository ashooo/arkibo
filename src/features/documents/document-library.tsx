"use client";

import { ChevronDown } from "lucide-react";
import { ScholarMascot } from "@/components/ui/scholar-mascot";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, FileText, FolderOpen, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredDocument } from "@/types/shared";
import { AddDocument } from "./add-document";
import { categories, categoryLabel, DocumentDialog, DocumentStatus, inputStyle } from "./document-ui";

type SearchResult = StoredDocument & { snippet?: string | null; matchType?: string };
export function DocumentLibrary({ initialAddOpen = false }: { initialAddOpen?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [documents, setDocuments] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [addOpen, setAddOpen] = useState(initialAddOpen);
  const [preview, setPreview] = useState<SearchResult | null>(null);
  const [deleting, setDeleting] = useState<SearchResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const attempts = useRef(new Map<string, number>());
  function upsert(record: StoredDocument) {
    setDocuments((current) => current.some((entry) => entry.id === record.id) ? current.map((entry) => entry.id === record.id ? { ...entry, ...record } : entry) : [{ ...record }, ...current]);
    setPreview((current) => current?.id === record.id ? { ...current, ...record } : current);
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
        {loading && !documents.length ? <div className="space-y-4 p-5" role="status"><span className="sr-only">Loading documents</span>{[0, 1, 2].map((id) => <div key={id} className="h-28 animate-pulse rounded-xl bg-surface-low dark:bg-dark-cardAlt" />)}</div> : !visible.length ? <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-14 text-center">{query || category ? <span className="feature-icon mb-5" data-tone="purple"><FolderOpen size={30} /></span> : <ScholarMascot size={96} className="mb-5" />}<h2 className="text-xl font-bold sm:text-2xl">{query || category ? "No matching documents" : "A home for your scholarship documents"}</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">{query || category ? "Try a different search or category. Extracted text becomes searchable once processing is complete." : "Add enrollment proofs, grade reports, and IDs. Keep the original and find it later by the words inside."}</p><Button variant={query || category ? "secondary" : "primary"} className="mt-5 min-h-11" onClick={() => { if (query || category) { setQuery(""); setCategory(""); } else setAddOpen(true); }}>{query || category ? "Clear filters" : <><Plus size={17} />Add your first document</>}</Button></div> : <ul className={`divide-y divide-slate-border dark:divide-dark-border ${loading ? "opacity-60" : ""}`}>{visible.map((record) => <li key={record.id} className="group flex flex-col gap-4 p-4 transition-colors hover:bg-surface/70 dark:hover:bg-dark-cardAlt/50 sm:flex-row sm:items-start sm:p-5"><span aria-hidden="true" className="hidden size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-dark-accentSurface dark:text-dark-accent sm:grid"><FileText size={24} /></span><div className="min-w-0 flex-1"><button onClick={() => setPreview(record)} className="max-w-full truncate text-left text-sm font-bold hover:text-primary hover:underline dark:hover:text-dark-accent" title={record.originalName}>{record.originalName}</button><p className="mt-1 text-xs text-on-surface-variant dark:text-slate-400">{categoryLabel(record.category)}<span className="px-2">·</span><time dateTime={record.uploadedAt}>{new Date(record.uploadedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</time></p><div className="mt-3 flex flex-wrap items-center gap-2"><DocumentStatus status={record.ocrStatus} />{query && record.matchType && <span className="text-xs text-slate-500">{record.matchType.replaceAll("_", " ")} match</span>}</div>{record.snippet && <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">{record.snippet}</p>}</div><div className="flex shrink-0 items-center gap-1 self-start"><Button variant="secondary" size="sm" className="min-h-10" onClick={() => setPreview(record)}>View</Button>{record.ocrStatus !== "complete" && <Button variant="ghost" size="sm" className="min-h-10" disabled={!!busyId} onClick={() => void action(record, record.ocrStatus === "failed")}>{busyId === record.id ? "Working…" : record.ocrStatus === "failed" ? "Retry extraction" : "Check status"}</Button>}<Button variant="ghost" size="icon" className="min-h-10 text-slate-400 hover:text-red-700" aria-label={`Remove ${record.originalName}`} disabled={!!busyId} onClick={() => setDeleting(record)}><Trash2 size={17} /></Button></div></li>)}</ul>}
      </div>
      {!loading && visible.length > 0 && <p className="border-t border-slate-border px-5 py-3 text-xs text-slate-500 dark:border-dark-border">Showing {visible.length} {visible.length === 1 ? "document" : "documents"}{documents.length === 50 ? " from your 50 most recent matches" : ""}. Originals remain available while text is processing.</p>}
    </div>
    {addOpen && <AddDocument onClose={closeAdd} onAdded={(record, warning) => { upsert(record); setQuery(""); setCategory(""); setNotice(warning ?? "Document added. Text extraction is processing in the background."); closeAdd(); setRevision((value) => value + 1); }} />}
    {preview && <DocumentPreview record={preview} onClose={() => setPreview(null)} onAction={() => void action(preview, preview.ocrStatus === "failed")} busy={busyId === preview.id} error={error} />}
    {deleting && <DocumentDialog title="Remove this document?" onClose={() => setDeleting(null)} busy={!!busyId}><div className="space-y-5 p-6"><p className="break-words text-sm"><strong>{deleting.originalName}</strong> will be removed from your library and detached from checklist items. This cannot be undone.</p><p className="text-xs text-slate-500">This removes the local file. Any copy already sent to Lumen is subject to its retention policy.</p><div className="flex justify-end gap-3"><Button variant="secondary" disabled={!!busyId} onClick={() => setDeleting(null)}>Keep document</Button><Button variant="danger" isLoading={!!busyId} onClick={() => void remove()}>Remove document</Button></div></div></DocumentDialog>}
  </section>;
}

function DocumentPreview({ record, onClose, onAction, busy, error }: { record: SearchResult; onClose: () => void; onAction: () => void; busy: boolean; error: string }) {
  const source = `/api/documents/${record.id}/file`;
  const image = ["image/png", "image/jpeg", "image/webp"].includes(record.mimeType);
  return <DocumentDialog title={record.originalName} description={`${categoryLabel(record.category)} · Original document and extracted text`} wide onClose={onClose}>
    {error && <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    <div className="grid lg:grid-cols-2"><div className="flex min-h-64 items-center justify-center bg-surface p-4 dark:bg-dark-bg">{record.mimeType === "application/pdf" ? <iframe src={source} title={`Original: ${record.originalName}`} className="h-[55dvh] min-h-80 w-full rounded-lg border border-slate-border dark:border-dark-border" /> : image ?
      // Protected account routes must bypass image optimization.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={source} alt={`Original ${record.originalName}`} className="max-h-[65dvh] w-full rounded-lg object-contain" /> : <div className="space-y-3 text-center"><FileText size={40} className="mx-auto text-slate-400" /><p className="text-sm">A preview isn’t available for this file type.</p><a href={source} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary dark:text-dark-accent">Open original document</a></div>}</div><div className="space-y-5 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Extracted text</h3><DocumentStatus status={record.ocrStatus} /></div><p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">Text extraction can make mistakes. Check the original before using this information for grades or scholarship requirements.</p>{record.ocrText ? <pre className="max-h-[45dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-border bg-surface p-4 font-mono text-xs leading-6 dark:border-dark-border dark:bg-dark-bg">{record.ocrText}</pre> : <div className="rounded-xl border border-dashed border-slate-border p-5 text-sm leading-relaxed text-slate-500 dark:border-dark-border dark:text-slate-400">{record.ocrStatus === "pending" ? "Your original is saved. We’re extracting its text. Automatic checks pause after a short while; you can check again below." : record.ocrStatus === "failed" ? "Your original is safe, but we couldn’t extract its text. Retry extraction or add a clearer copy." : "Extraction finished without readable text. You can still open and use the original document."}</div>}{record.ocrError && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{record.ocrError}</p>}<div className="flex flex-wrap items-center gap-3"><a href={source} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline dark:text-dark-accent">Open original<ArrowUpRight size={16} /></a>{record.ocrStatus !== "complete" && <Button variant="secondary" isLoading={busy} onClick={onAction}>{record.ocrStatus === "failed" ? "Retry extraction" : "Check status"}</Button>}</div></div></div>
  </DocumentDialog>;
}
