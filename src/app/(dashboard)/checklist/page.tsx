"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStudent } from "@/lib/student-context";
import { AccountWorkspace } from "@/features/account-workspace";
import { requirementTemplates } from "@/data/requirements";
import { useChecklist, type ItemState } from "@/features/checklist/use-checklist";
import type { ChecklistStatus, StoredDocument } from "@/types/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarDays, Check, CheckSquare, ChevronDown, FileText, GraduationCap, IdCard, LoaderCircle, MapPin, Paperclip, Plus, ReceiptText, StickyNote, Unlink, Upload, X } from "lucide-react";

type FilterMode = "all" | "to_do" | "prepared" | "attention";

const statusOptions: { value: ChecklistStatus; label: string; variant: "neutral" | "primary" | "success" | "warning"; bar: string }[] = [
  { value: "prepared", label: "Prepared", variant: "success", bar: "bg-emerald-500" },
  { value: "uploaded", label: "Uploaded", variant: "primary", bar: "bg-blue-500" },
  { value: "needs_attention", label: "Needs Attention", variant: "warning", bar: "bg-amber-500" },
  { value: "missing", label: "Missing", variant: "neutral", bar: "bg-slate-300 dark:bg-slate-600" },
];
const requirementIcons = [GraduationCap, GraduationCap, IdCard, MapPin, ReceiptText];
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-card";


export default function ChecklistPage() {
  const { applicationType, user } = useStudent();
  return <AccountWorkspace><ChecklistWorkspace key={`${user?.id}:${applicationType}`} /></AccountWorkspace>;
}

function ChecklistWorkspace() {
  const { applicationType } = useStudent();
  const { items, customTemplates, deadline, loaded, pending, error, updateItem, saveDeadline, addRequirement: saveRequirement } = useChecklist(applicationType);
  const isRenewal = applicationType === "renewal";
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [attachTo, setAttachTo] = useState<string | null>(null);
  const [replacingAttachment, setReplacingAttachment] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const templates = useMemo(() => [
    ...requirementTemplates.filter((item) => item.applicationType === applicationType),
    ...customTemplates.filter((item) => item.applicationType === applicationType),
  ].sort((a, b) => a.sortOrder - b.sortOrder), [applicationType, customTemplates]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch { setDocuments([]); }
  };
  useEffect(() => {
    let active = true;
    void fetch("/api/documents").then(async (response) => {
      if (!response.ok) throw new Error("Unable to load documents.");
      return response.json();
    }).then((data) => {
      if (active) setDocuments(Array.isArray(data.documents) ? data.documents : []);
    }).catch(() => { if (active) setDocuments([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!attachTo && !showAddRequirement) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAttachTo(null);
        setShowAddRequirement(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attachTo, showAddRequirement]);

  const getItem = (id: string): ItemState => items[id] ?? { status: "missing", notes: "", documentIds: [] };
  const totals = templates.reduce((counts, template) => {
    counts[getItem(template.id).status] += 1;
    return counts;
  }, { missing: 0, uploaded: 0, prepared: 0, needs_attention: 0 });
  const total = templates.length;
  const percent = total ? Math.round((totals.prepared / total) * 100) : 0;
  const attachedDocumentIds = new Set(templates.flatMap((template) => getItem(template.id).documentIds));
  const incompleteRequirement = templates.find((template) => getItem(template.id).status !== "prepared");
  const daysRemaining = deadline ? Math.ceil((new Date(`${deadline}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000) : null;
  const filterCounts: Record<FilterMode, number> = {
    all: total,
    to_do: totals.missing + totals.uploaded,
    prepared: totals.prepared,
    attention: totals.needs_attention,
  };
  const visibleTemplates = templates.filter((template) => {
    const status = getItem(template.id).status;
    if (filter === "to_do") return status === "missing" || status === "uploaded";
    if (filter === "prepared") return status === "prepared";
    if (filter === "attention") return status === "needs_attention";
    return true;
  });

  const addRequirement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = customTitle.trim();
    const description = customDescription.trim();
    if (!title) return;
    if (await saveRequirement(title, description)) {
      setCustomTitle("");
      setCustomDescription("");
      setShowAddRequirement(false);
      toast.success("Requirement added to your checklist");
    }
  };
  const resolveNext = () => {
    if (!incompleteRequirement) return;
    setFilter("all");
    requestAnimationFrame(() => {
      const element = cardRefs.current[incompleteRequirement.id];
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    });
  };
  const openAttachmentPicker = async (requirementId: string, replace = false) => {
    setAttachTo(requirementId);
    setReplacingAttachment(replace);
    setLoadingDocs(true);
    await fetchDocuments();
    setLoadingDocs(false);
  };
  const attachDocument = async (document: StoredDocument) => {
    if (!attachTo) return;
    const current = getItem(attachTo);
    const existing = replacingAttachment ? [] : current.documentIds;
    if (!existing.includes(document.id) && !await updateItem(attachTo, { documentIds: [...existing, document.id] })) return;
    setAttachTo(null);
    toast.success(`Document attached: ${document.originalName}`);
  };
  const setStatus = async (id: string, status: ChecklistStatus) => {
    if (await updateItem(id, { status }) && status === "prepared") toast.success("Requirement marked as prepared");
  };
  const toggleNotes = (id: string) => {
    setOpenNotes((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const filters: [FilterMode, string][] = [["all", "All"], ["to_do", "To do"], ["prepared", "Prepared"], ["attention", "Needs attention"]];

  if (!loaded) return <p role="status">{error || "Loading your saved checklist…"}</p>;

  return <div className="flex flex-col gap-6">
    {(Boolean(error) || !loaded || pending > 0) && <p role="status" className="text-sm text-on-surface-variant dark:text-dark-muted">{error || (!loaded ? "Loading checklist…" : "Saving changes…")}</p>}
    <header className="flex flex-wrap items-start justify-between gap-4 py-2">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface dark:text-slate-100 sm:text-4xl">Scholarship Checklist</h1>
          <Badge variant="primary" size="sm">{isRenewal ? "Renewal Track" : "New Applicant Track"}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">Track your requirements, attach saved documents, and mark each step as you complete it.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" className="min-h-11" onClick={() => setShowAddRequirement(true)}>
          <Plus aria-hidden="true" size={16} />Add requirement
        </Button>
        <Link href="/documents?add=1" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><Upload className="h-4 w-4" />Upload a document</Link>
      </div>
    </header>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your progress</p><p className="mt-1 text-4xl font-extrabold tabular-nums text-on-surface dark:text-slate-100">{percent}%</p></div>
          <p className="pb-1 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-200">{totals.prepared} of {total}</span> prepared</p>
        </div>
        <div className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-cardAlt" role="img" aria-label={`${totals.prepared} prepared, ${totals.uploaded} uploaded, ${totals.needs_attention} need attention, ${totals.missing} missing`}>
          {statusOptions.map((status) => {
            const count = totals[status.value];
            if (!count || !total) return null;
            return <div key={status.value} className={`${status.bar} h-full transition-all duration-300`} style={{ width: `${(count / total) * 100}%` }} title={`${status.label}: ${count}`} />;
          })}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          {statusOptions.map((status) => <div key={status.value} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.bar}`} aria-hidden="true" /><dt className="text-slate-600 dark:text-slate-300">{status.label}</dt><dd className="font-bold tabular-nums text-on-surface dark:text-slate-100">{totals[status.value]}</dd></div>)}
        </dl>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-dark-border">
          <div><p className="text-lg font-extrabold tabular-nums text-on-surface dark:text-slate-100">{totals.prepared} / {total}</p><p className="text-xs text-slate-500">Requirements prepared</p></div>
          <div><p className="text-lg font-extrabold tabular-nums text-on-surface dark:text-slate-100">{attachedDocumentIds.size}</p><p className="text-xs text-slate-500">Documents uploaded</p></div>
          <div><p className="text-lg font-extrabold tabular-nums text-on-surface dark:text-slate-100">{totals.missing}</p><p className="text-xs text-slate-500">Missing requirements</p></div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className={`h-5 w-5 ${incompleteRequirement ? "text-amber-700 dark:text-amber-300" : "text-primary"}`} aria-hidden="true" /><h2 className="font-bold text-on-surface dark:text-slate-100">Application deadline</h2></div><Badge variant={incompleteRequirement ? "warning" : "success"} size="sm">{incompleteRequirement ? "Action Needed" : "On track"}</Badge></div>
        <p className="mt-3 text-xl font-extrabold text-on-surface dark:text-slate-100">{deadline ? new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Deadline not yet announced"}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{daysRemaining === null ? "Set a deadline once the scholarship office confirms it." : daysRemaining < 0 ? "This date has passed. Check with the scholarship office for updates." : daysRemaining === 0 ? "The deadline is today. Review your remaining items." : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining. Keep working through your checklist.`}</p>
        <label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="scholarship-deadline">Deadline (use a verified date)</label>
        <input id="scholarship-deadline" type="date" value={deadline} onChange={(event) => void saveDeadline(event.target.value)} disabled={!loaded} className={`mt-1 min-h-11 w-full rounded-lg border border-slate-border bg-white px-3 text-sm text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 ${focusRing}`} />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Saved to your account. Use a date confirmed by the scholarship office.</p>
        <Button variant="primary" className="mt-4 min-h-11 w-full" onClick={resolveNext} disabled={!incompleteRequirement}>{incompleteRequirement ? "Resolve Now" : "All requirements prepared"}</Button>
        {incompleteRequirement && <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">Next: {incompleteRequirement.title}</p>}
      </Card>
    </div>

    {showAddRequirement && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddRequirement(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-requirement-title" className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-dark-card sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-blue-950/60 dark:text-blue-300"><Plus aria-hidden="true" size={20} /></div>
            <div>
              <h2 id="add-requirement-title" className="font-bold text-on-surface dark:text-slate-100">Add a requirement</h2>
            </div>
          </div>
          <button type="button" onClick={() => setShowAddRequirement(false)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dark-cardAlt ${focusRing}`} aria-label="Close dialog"><X aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={addRequirement}>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Requirement name
            <input autoFocus required maxLength={100} value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="e.g. Certificate of good moral character" className={`mt-1 min-h-11 w-full rounded-md border border-slate-border bg-white px-3 text-sm font-normal text-slate-700 placeholder:text-slate-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 ${focusRing}`} />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Details <span className="font-normal">(optional)</span>
            <textarea rows={3} maxLength={240} value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} placeholder="Add a note about this document" className={`mt-1 w-full resize-y rounded-md border border-slate-border bg-white px-3 py-2.5 text-sm font-normal text-slate-700 placeholder:text-slate-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 ${focusRing}`} />
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-border pt-4 dark:border-dark-border">
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => setShowAddRequirement(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="min-h-11"><Plus aria-hidden="true" size={16} />Add item</Button>
          </div>
        </form>
      </section>
    </div>}

    <section aria-labelledby="requirements-heading" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="requirements-heading" className="text-xl font-semibold text-on-surface dark:text-slate-100">Your requirements</h2>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">{total} items · {totals.prepared} prepared</p>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter checklist">
          {filters.map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "primary" : "secondary"} className="min-h-10 shrink-0" onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}<span className={`ml-1.5 rounded-full px-1.5 text-xs font-bold tabular-nums ${filter === value ? "bg-white/25" : "bg-slate-100 text-slate-600 dark:bg-dark-cardAlt dark:text-slate-300"}`}>{filterCounts[value]}</span></Button>)}
        </div>
      </div>

    <ul className="flex flex-col gap-3">
      {loaded && visibleTemplates.map((template) => {
        const item = getItem(template.id);
        const isPrepared = item.status === "prepared";
        const Icon = requirementIcons[template.sortOrder - 1] ?? FileText;
        const notesOpen = openNotes.has(template.id) || item.notes.length > 0;
        return <li key={template.id}>
          <Card ref={(element) => { cardRefs.current[template.id] = element; }} tabIndex={-1} className="relative scroll-mt-24 overflow-hidden rounded-2xl p-4 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <button type="button" role="checkbox" aria-checked={isPrepared} aria-label={`Mark ${template.title} as ${isPrepared ? "not prepared" : "prepared"}`} onClick={() => setStatus(template.id, isPrepared ? "missing" : "prepared")} className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isPrepared ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600"} ${focusRing}`}><Check className="h-4 w-4" strokeWidth={3} /></button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary dark:bg-blue-950/50 dark:text-blue-300"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                <div className="min-w-0 flex-1"><h2 className={`font-bold ${isPrepared ? "text-slate-500 dark:text-slate-400" : "text-on-surface dark:text-slate-100"}`}>{template.title}</h2><p className="mt-1 text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">{template.description}</p></div>
              </div>
              <label className="relative flex min-h-11 shrink-0 items-center"><span className="sr-only">Status for {template.title}</span><select value={item.status} onChange={(event) => setStatus(template.id, event.target.value as ChecklistStatus)} className={`min-h-11 w-full appearance-none rounded-lg border border-slate-border bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 sm:w-48 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 ${focusRing}`}>{[...statusOptions].reverse().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" aria-hidden="true" /></label>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {item.documentIds.map((id) => {
                  const doc = documents.find((document) => document.id === id);
                  const name = doc?.originalName ?? `Document ${id.slice(0, 8)}`;
                  return <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-3 pr-1 text-xs dark:border-dark-border dark:bg-dark-cardAlt"><FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" /><a href={`/api/documents/${encodeURIComponent(id)}/file`} target="_blank" rel="noreferrer" className={`min-h-8 inline-flex max-w-[14rem] items-center truncate rounded px-1 font-medium text-primary hover:underline ${focusRing}`} aria-label={`Preview or open ${name}`}>{name}</a><button type="button" aria-label={`Remove ${name}`} title="Remove" className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 ${focusRing}`} onClick={() => updateItem(template.id, { documentIds: item.documentIds.filter((documentId) => documentId !== id) })}><Unlink className="h-3.5 w-3.5" /></button></span>;
                })}
                {item.documentIds.length === 0 && <span className="text-xs text-slate-500">No document attached</span>}
              </div>
              <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" className="min-h-11" onClick={() => toggleNotes(template.id)} aria-expanded={notesOpen}><StickyNote className="h-4 w-4" />{item.notes ? "Edit note" : "Add note"}</Button><Button variant="secondary" size="sm" className="min-h-11" onClick={() => void openAttachmentPicker(template.id, item.documentIds.length > 0)}><Paperclip className="h-4 w-4" />{item.documentIds.length ? "Replace" : "Attach document"}</Button>{item.status === "missing" && <Link href="/documents?add=1" className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-slate-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-cardAlt ${focusRing}`}><Upload className="h-4 w-4" />Upload</Link>}</div>
            </div>
            {notesOpen && <div className="mt-3"><label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor={`notes-${template.id}`}>Note</label><textarea id={`notes-${template.id}`} rows={2} value={item.notes} onChange={(event) => updateItem(template.id, { notes: event.target.value })} placeholder="Add a reminder or question…" className={`w-full resize-y rounded-lg border border-slate-border bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 ${focusRing}`} /></div>}
          </Card>
        </li>;
      })}
      {loaded && visibleTemplates.length === 0 && <li><Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center"><CheckSquare className="mb-3 h-9 w-9 text-slate-400" aria-hidden="true" /><h2 className="font-bold text-on-surface dark:text-slate-100">Nothing in this filter</h2><p className="mt-1 text-sm text-slate-500">Choose another filter to see your requirements.</p><Button variant="secondary" className="mt-4 min-h-11" onClick={() => setFilter("all")}>Show all requirements</Button></Card></li>}
      {!loaded && [0, 1, 2].map((key) => <li key={key} aria-hidden="true"><div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-dark-cardAlt" /></li>)}
      {!loaded && <li className="sr-only" role="status">Loading checklist…</li>}
    </ul>
    </section>

    {attachTo && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAttachTo(null); }}><section role="dialog" aria-modal="true" aria-labelledby="document-picker-title" className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-dark-card sm:rounded-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="document-picker-title" className="text-lg font-bold text-on-surface dark:text-slate-100">Attach a saved document</h2><p className="mt-1 text-sm text-slate-500">Choose a file from My Documents.</p></div><button type="button" onClick={() => setAttachTo(null)} className={`flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dark-cardAlt ${focusRing}`} aria-label="Close document picker"><X className="h-5 w-5" /></button></div>
      {loadingDocs ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status"><LoaderCircle className="h-4 w-4 animate-spin" />Loading documents…</div> : documents.length ? <ul className="mt-4 flex flex-col gap-2">{documents.map((document) => <li key={document.id}><button type="button" onClick={() => attachDocument(document)} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-primary hover:bg-primary-soft/40 dark:border-dark-border dark:hover:bg-dark-cardAlt ${focusRing}`}><FileText className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{document.originalName}</span><span className="block text-xs text-slate-500">{document.category}</span></span><span className="text-xs font-semibold text-primary">Attach</span></button></li>)}</ul> : <div className="py-8 text-center"><FileText className="mx-auto mb-3 h-9 w-9 text-slate-400" /><p className="font-semibold text-slate-700 dark:text-slate-200">No saved documents yet</p><p className="mt-1 text-sm text-slate-500">Upload a file to My Documents, then return here to attach it.</p><Link href="/documents?add=1" onClick={() => setAttachTo(null)} className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-light ${focusRing}`}>Add a document</Link></div>}
    </section></div>}
  </div>;
}
