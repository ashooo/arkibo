"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStudent } from "@/lib/student-context";
import { AccountWorkspace } from "@/features/account-workspace";
import { useChecklist, type ChecklistFolder, type ItemState } from "@/features/checklist/use-checklist";
import { AddDocument } from "@/features/documents/add-document";
import type { ChecklistStatus, StoredDocument } from "@/types/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Check, CheckSquare, ChevronDown, ChevronRight, FileText, Folder, FolderPlus, LoaderCircle, Paperclip, Pencil, Plus, StickyNote, Trash2, Unlink, Upload, X } from "lucide-react";

type FilterMode = "all" | "to_do" | "prepared" | "attention";

const statusOptions: { value: ChecklistStatus; label: string; variant: "neutral" | "primary" | "success" | "warning"; bar: string }[] = [
  { value: "prepared", label: "Prepared", variant: "success", bar: "bg-emerald-500" },
  { value: "uploaded", label: "Uploaded", variant: "primary", bar: "bg-blue-500" },
  { value: "needs_attention", label: "Needs Attention", variant: "warning", bar: "bg-amber-500" },
  { value: "missing", label: "Missing", variant: "neutral", bar: "bg-slate-300 dark:bg-slate-600" },
];
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-card";
const fieldStyle = `mt-1 min-h-11 w-full rounded-md border border-slate-border bg-white px-3 text-sm font-normal text-slate-700 placeholder:text-slate-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 ${focusRing}`;

function daysUntil(deadline: string) {
  if (!deadline) return null;
  return Math.ceil((new Date(`${deadline}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
}
function formatDate(deadline: string, month: "long" | "short" = "long") {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month, day: "numeric" });
}
function deadlineBadge(deadline: string, done: boolean): { label: string; variant: "neutral" | "primary" | "success" | "warning" } {
  const days = daysUntil(deadline);
  if (done) return { label: "Complete", variant: "success" };
  if (days === null) return { label: "No deadline", variant: "neutral" };
  if (days < 0) return { label: "Past due", variant: "warning" };
  if (days === 0) return { label: "Due today", variant: "warning" };
  if (days <= 7) return { label: `${days} day${days === 1 ? "" : "s"} left`, variant: "warning" };
  return { label: `${days} days left`, variant: "primary" };
}

function Dialog({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-dark-card sm:rounded-2xl sm:p-6">{children}</section>
  </div>;
}
function DialogHeader({ id, title, description, icon, onClose }: { id: string; title: string; description?: string; icon: React.ReactNode; onClose: () => void }) {
  return <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-blue-950/60 dark:text-blue-300">{icon}</div>
      <div><h2 id={id} className="font-bold text-on-surface dark:text-slate-100">{title}</h2>{description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
    </div>
    <button type="button" onClick={onClose} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dark-cardAlt ${focusRing}`} aria-label="Close dialog"><X aria-hidden="true" className="h-5 w-5" /></button>
  </div>;
}

export default function ChecklistPage() {
  const { user } = useStudent();
  return <AccountWorkspace><ChecklistWorkspace key={user?.id} /></AccountWorkspace>;
}

function ChecklistWorkspace() {
  const checklist = useChecklist();
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  // Every account has at least the default folder, so an empty list means the first load hasn't finished.
  if (!checklist.lists.length) return <p role="status" className="text-sm text-slate-500">{checklist.error || "Loading your application folders…"}</p>;

  const openFolder = async (id: string) => {
    setOpenFolderId(id);
    window.scrollTo({ top: 0 });
    if (id !== checklist.listId) await checklist.switchChecklist(id);
  };
  const closeFolder = () => {
    setOpenFolderId(null);
    void checklist.refreshFolders();
  };

  if (openFolderId) return <FolderDetail checklist={checklist} onBack={closeFolder} />;
  return <FolderOverview checklist={checklist} onOpen={openFolder} />;
}

type Checklist = ReturnType<typeof useChecklist>;

function FolderOverview({ checklist, onOpen }: { checklist: Checklist; onOpen: (id: string) => void }) {
  const { lists, createChecklist, pending, error } = checklist;
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (await createChecklist(trimmed)) {
      setName("");
      setShowCreate(false);
      toast.success(`Folder created: ${trimmed}`);
    }
  };
  const closeCreate = () => setShowCreate(false);

  return <div className="flex flex-col gap-6">
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    <header className="workspace-banner">
      <div>
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-on-surface dark:text-slate-100 sm:text-3xl">Application Checklist</h1>
        <p className="text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">Each folder is one application with its own deadline, requirements, and attached files. Open a folder to work on it.</p>
      </div>
      <Button type="button" variant="primary" className="min-h-11 shrink-0" onClick={() => setShowCreate(true)}><FolderPlus aria-hidden="true" size={16} />New folder</Button>
    </header>

    <section aria-labelledby="folders-heading">
      <h2 id="folders-heading" className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Your folders <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600 dark:bg-dark-cardAlt dark:text-slate-300">{lists.length}</span></h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lists.map((folder) => <li key={folder.id}><FolderCard folder={folder} onOpen={() => onOpen(folder.id)} /></li>)}
        <li>
          <button type="button" onClick={() => setShowCreate(true)} className={`flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-600 transition-colors hover:border-primary hover:bg-primary-soft/40 hover:text-primary dark:border-slate-600 dark:text-slate-300 dark:hover:bg-dark-cardAlt ${focusRing}`}>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 dark:bg-dark-cardAlt"><Plus aria-hidden="true" size={20} /></span>
            Add an application folder
          </button>
        </li>
      </ul>
    </section>

    {showCreate && <Dialog titleId="create-folder-title" onClose={closeCreate}>
      <DialogHeader id="create-folder-title" title="New application folder" description="Name it after the scholarship or program you're applying to." icon={<FolderPlus aria-hidden="true" size={20} />} onClose={closeCreate} />
      <form className="mt-5 space-y-4" onSubmit={create}>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Folder name
          <input autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. ABC Foundation Grant 2027" className={fieldStyle} />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">You can set the deadline and add requirements after opening the folder.</p>
        <div className="flex justify-end gap-2 border-t border-slate-border pt-4 dark:border-dark-border">
          <Button type="button" variant="secondary" className="min-h-11" onClick={closeCreate}>Cancel</Button>
          <Button type="submit" variant="primary" className="min-h-11" disabled={pending > 0}><FolderPlus aria-hidden="true" size={16} />Create folder</Button>
        </div>
      </form>
    </Dialog>}
  </div>;
}

function FolderCard({ folder, onOpen }: { folder: ChecklistFolder; onOpen: () => void }) {
  const percent = folder.total ? Math.round((folder.prepared / folder.total) * 100) : 0;
  const done = folder.total > 0 && folder.prepared === folder.total;
  const badge = deadlineBadge(folder.deadline, done);
  return <button type="button" onClick={onOpen} aria-label={`Open ${folder.name}`} className={`group flex h-full min-h-44 w-full flex-col rounded-2xl border border-slate-border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card dark:border-dark-border dark:bg-dark-card ${focusRing}`}>
    <div className="flex items-start justify-between gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-blue-950/50 dark:text-blue-300"><Folder aria-hidden="true" size={22} /></span>
      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
    </div>
    <h3 className="mt-3 line-clamp-2 font-bold text-on-surface dark:text-slate-100">{folder.name}</h3>
    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><CalendarDays aria-hidden="true" size={14} />{folder.deadline ? `Due ${formatDate(folder.deadline, "short")}` : "No deadline set"}</p>
    <div className="mt-auto pt-4">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"><span><span className="font-bold tabular-nums">{folder.prepared}/{folder.total}</span> prepared · {folder.documents} file{folder.documents === 1 ? "" : "s"}</span><span className="font-bold tabular-nums">{percent}%</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-cardAlt" aria-hidden="true"><div className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${percent}%` }} /></div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Open folder<ChevronRight aria-hidden="true" size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
    </div>
  </button>;
}

function FolderDetail({ checklist, onBack }: { checklist: Checklist; onBack: () => void }) {
  const { items, customTemplates, deadline, loaded, pending, error, listId, lists, updateItem, saveDeadline, addRequirement: saveRequirement, editRequirement, deleteRequirement } = checklist;
  const folder = lists.find((list) => list.id === listId);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [attachTo, setAttachTo] = useState<string | null>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const templates = useMemo(() => customTemplates.slice().sort((a, b) => a.sortOrder - b.sortOrder), [customTemplates]);

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

  const getItem = (id: string): ItemState => items[id] ?? { status: "missing", notes: "", documentIds: [] };
  const totals = templates.reduce((counts, template) => {
    counts[getItem(template.id).status] += 1;
    return counts;
  }, { missing: 0, uploaded: 0, prepared: 0, needs_attention: 0 });
  const total = templates.length;
  const percent = total ? Math.round((totals.prepared / total) * 100) : 0;
  const attachedDocumentIds = new Set(templates.flatMap((template) => getItem(template.id).documentIds));
  const incompleteRequirement = templates.find((template) => getItem(template.id).status !== "prepared");
  const daysRemaining = daysUntil(deadline);
  const filterCounts: Record<FilterMode, number> = { all: total, to_do: totals.missing + totals.uploaded, prepared: totals.prepared, attention: totals.needs_attention };
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
    if (!title) return;
    const saved = editingId ? await editRequirement(editingId, title, customDescription.trim()) : await saveRequirement(title, customDescription.trim());
    if (saved) {
      toast.success(editingId ? "Requirement updated" : "Requirement added to this folder");
      closeAddRequirement();
    }
  };
  const openAddRequirement = () => {
    setEditingId(null);
    setCustomTitle("");
    setCustomDescription("");
    setShowAddRequirement(true);
  };
  const openEditRequirement = (id: string) => {
    const template = templates.find((entry) => entry.id === id);
    if (!template) return;
    setEditingId(id);
    setCustomTitle(template.title);
    setCustomDescription(template.description);
    setShowAddRequirement(true);
  };
  const confirmDelete = async () => {
    if (!deletingId || deleting) return;
    const removedId = deletingId;
    const template = templates.find((entry) => entry.id === removedId);
    setDeleting(true);
    const removed = await deleteRequirement(removedId);
    setDeleting(false);
    if (removed) {
      setDeletingId(null);
      setOpenNotes((current) => { const next = new Set(current); next.delete(removedId); return next; });
      toast.success(`Requirement deleted${template ? `: ${template.title}` : ""}`);
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
  const openAttachmentPicker = async (requirementId: string) => {
    setAttachTo(requirementId);
    setLoadingDocs(true);
    await fetchDocuments();
    setLoadingDocs(false);
  };
  const attach = async (requirementId: string, document: StoredDocument) => {
    const existing = getItem(requirementId).documentIds;
    if (!existing.includes(document.id) && !await updateItem(requirementId, { documentIds: [...existing, document.id] })) return false;
    toast.success(`File attached: ${document.originalName}`);
    return true;
  };
  const attachDocument = async (document: StoredDocument) => {
    if (!attachTo) return;
    if (await attach(attachTo, document)) setAttachTo(null);
  };
  const startUpload = () => {
    setUploadFor(attachTo);
    setAttachTo(null);
  };
  const onUploaded = async (document: StoredDocument, warning?: string) => {
    const target = uploadFor;
    setUploadFor(null);
    setDocuments((current) => [document, ...current.filter((entry) => entry.id !== document.id)]);
    if (warning) toast.warning(warning);
    if (target) await attach(target, document);
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
  const closeAddRequirement = () => {
    setShowAddRequirement(false);
    setEditingId(null);
    setCustomTitle("");
    setCustomDescription("");
  };
  const closeDelete = () => { if (!deleting) setDeletingId(null); };
  const deletingRequirement = templates.find((template) => template.id === deletingId);
  const closePicker = () => setAttachTo(null);
  const filters: [FilterMode, string][] = [["all", "All"], ["to_do", "To do"], ["prepared", "Prepared"], ["attention", "Needs attention"]];
  const pickerRequirement = templates.find((template) => template.id === (attachTo ?? uploadFor));

  return <div className="flex flex-col gap-6">
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <button type="button" onClick={onBack} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 font-semibold text-primary hover:bg-primary-soft/60 dark:hover:bg-dark-cardAlt ${focusRing}`}><ArrowLeft aria-hidden="true" size={16} />All folders</button>
      <ChevronRight aria-hidden="true" size={14} className="text-slate-400" />
      <span className="truncate font-semibold text-slate-700 dark:text-slate-200" aria-current="page">{folder?.name ?? "Folder"}</span>
    </nav>

    <header className="workspace-banner">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-blue-950/50 dark:text-blue-300"><Folder aria-hidden="true" size={24} /></span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-on-surface dark:text-slate-100 sm:text-3xl">{folder?.name ?? "Folder"}</h1>
          <p className="text-sm text-on-surface-variant dark:text-slate-400" role="status">{error || (!loaded ? "Loading folder…" : pending ? "Saving changes…" : "All changes saved.")}</p>
        </div>
      </div>
      <Button type="button" variant="primary" className="min-h-11 shrink-0" onClick={openAddRequirement} disabled={!loaded}><Plus aria-hidden="true" size={16} />Add requirement</Button>
    </header>

    {!loaded ? <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((key) => <div key={key} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-dark-cardAlt" />)}</div> : <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Progress</p><p className="mt-1 text-4xl font-extrabold tabular-nums text-on-surface dark:text-slate-100">{percent}%</p></div>
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
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-dark-border dark:text-slate-400"><Paperclip aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" /><span className="font-bold text-slate-700 dark:text-slate-200">{attachedDocumentIds.size}</span> file{attachedDocumentIds.size === 1 ? "" : "s"} attached in this folder</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" /><h2 className="font-bold text-on-surface dark:text-slate-100">Deadline</h2></div><Badge variant={deadlineBadge(deadline, total > 0 && !incompleteRequirement).variant} size="sm">{deadlineBadge(deadline, total > 0 && !incompleteRequirement).label}</Badge></div>
          <p className="mt-3 text-xl font-extrabold text-on-surface dark:text-slate-100">{deadline ? formatDate(deadline) : "No deadline set"}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{daysRemaining === null ? "Add a deadline so you know how much time you have." : daysRemaining < 0 ? "This date has passed. Check for any extension or update." : daysRemaining === 0 ? "The deadline is today. Review your remaining items." : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining.`}</p>
          <label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="folder-deadline">Set deadline</label>
          <input id="folder-deadline" type="date" value={deadline} onChange={(event) => void saveDeadline(event.target.value)} className={`mt-1 min-h-11 w-full rounded-lg border border-slate-border bg-white px-3 text-sm text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 ${focusRing}`} />
          <Button variant="secondary" className="mt-4 min-h-11 w-full" onClick={resolveNext} disabled={!incompleteRequirement}>{incompleteRequirement ? "Go to next requirement" : total ? "All requirements prepared" : "No requirements yet"}</Button>
          {incompleteRequirement && <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">Next: {incompleteRequirement.title}</p>}
        </Card>
      </div>

      <section aria-labelledby="requirements-heading" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="requirements-heading" className="text-xl font-semibold text-on-surface dark:text-slate-100">Requirements</h2>
            <p className="text-sm text-on-surface-variant dark:text-slate-400">{total} item{total === 1 ? "" : "s"} · {totals.prepared} prepared</p>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter requirements">
            {filters.map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "primary" : "secondary"} className="min-h-10 shrink-0" onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}<span className={`ml-1.5 rounded-full px-1.5 text-xs font-bold tabular-nums ${filter === value ? "bg-white/25" : "bg-slate-100 text-slate-600 dark:bg-dark-cardAlt dark:text-slate-300"}`}>{filterCounts[value]}</span></Button>)}
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {visibleTemplates.map((template) => {
            const item = getItem(template.id);
            const isPrepared = item.status === "prepared";
            const notesOpen = openNotes.has(template.id) || item.notes.length > 0;
            return <li key={template.id}>
              <Card ref={(element) => { cardRefs.current[template.id] = element; }} tabIndex={-1} className="relative scroll-mt-24 overflow-hidden p-4 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <button type="button" role="checkbox" aria-checked={isPrepared} aria-label={`Mark ${template.title} as ${isPrepared ? "not prepared" : "prepared"}`} onClick={() => setStatus(template.id, isPrepared ? "missing" : "prepared")} className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isPrepared ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600"} ${focusRing}`}><Check className="h-4 w-4" strokeWidth={3} /></button>
                    <div className="min-w-0 flex-1"><h3 className={`font-bold ${isPrepared ? "text-slate-500 line-through decoration-slate-300 dark:text-slate-400" : "text-on-surface dark:text-slate-100"}`}>{template.title}</h3>{template.description && <p className="mt-1 text-sm leading-relaxed text-on-surface-variant dark:text-slate-400">{template.description}</p>}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1"><label className="relative flex min-h-11 flex-1 items-center"><span className="sr-only">Status for {template.title}</span><select value={item.status} onChange={(event) => setStatus(template.id, event.target.value as ChecklistStatus)} className={`min-h-11 w-full appearance-none rounded-lg border border-slate-border bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 sm:w-48 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 ${focusRing}`}>{[...statusOptions].reverse().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" aria-hidden="true" /></label>
                    <button type="button" onClick={() => openEditRequirement(template.id)} aria-label={`Edit ${template.title}`} title="Edit requirement" className={`flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-dark-cardAlt ${focusRing}`}><Pencil aria-hidden="true" className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setDeletingId(template.id)} aria-label={`Delete ${template.title}`} title="Delete requirement" className={`flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300 ${focusRing}`}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {item.documentIds.map((id) => {
                      const doc = documents.find((document) => document.id === id);
                      const name = doc?.originalName ?? `Document ${id.slice(0, 8)}`;
                      return <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-3 pr-1 text-xs dark:border-dark-border dark:bg-dark-cardAlt"><FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" /><a href={`/api/documents/${encodeURIComponent(id)}/file`} target="_blank" rel="noreferrer" className={`inline-flex min-h-8 max-w-[14rem] items-center truncate rounded px-1 font-medium text-primary hover:underline ${focusRing}`} aria-label={`Open ${name}`}>{name}</a><button type="button" aria-label={`Remove ${name}`} title="Remove" className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 ${focusRing}`} onClick={() => updateItem(template.id, { documentIds: item.documentIds.filter((documentId) => documentId !== id) })}><Unlink className="h-3.5 w-3.5" /></button></span>;
                    })}
                    {item.documentIds.length === 0 && <span className="text-xs text-slate-500">No file attached</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" className="min-h-11" onClick={() => toggleNotes(template.id)} aria-expanded={notesOpen}><StickyNote className="h-4 w-4" />{item.notes ? "Edit note" : "Add note"}</Button>
                    <Button variant={item.documentIds.length ? "secondary" : "primary"} size="sm" className="min-h-11" onClick={() => void openAttachmentPicker(template.id)}><Paperclip className="h-4 w-4" />{item.documentIds.length ? "Attach another" : "Attach file"}</Button>
                  </div>
                </div>
                {notesOpen && <div className="mt-3"><label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor={`notes-${template.id}`}>Note</label><textarea id={`notes-${template.id}`} rows={2} value={item.notes} onChange={(event) => updateItem(template.id, { notes: event.target.value })} placeholder="Add a reminder or question…" className={`w-full resize-y rounded-lg border border-slate-border bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 ${focusRing}`} /></div>}
              </Card>
            </li>;
          })}
          {visibleTemplates.length === 0 && <li><Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center"><CheckSquare className="mb-3 h-9 w-9 text-slate-400" aria-hidden="true" /><h3 className="font-bold text-on-surface dark:text-slate-100">{total === 0 ? "This folder is empty" : "Nothing in this filter"}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{total === 0 ? "Add the requirements for this application, then attach a file to each one." : "Choose another filter to see your requirements."}</p><Button variant="secondary" className="mt-4 min-h-11" onClick={() => total === 0 ? openAddRequirement() : setFilter("all")}><Plus className="h-4 w-4" />{total === 0 ? "Add your first requirement" : "Show all requirements"}</Button></Card></li>}
        </ul>
      </section>
    </>}

    {showAddRequirement && <Dialog titleId="add-requirement-title" onClose={closeAddRequirement}>
      <DialogHeader id="add-requirement-title" title={editingId ? "Edit requirement" : "Add a requirement"} description={folder ? `${editingId ? "In" : "To"} ${folder.name}` : undefined} icon={editingId ? <Pencil aria-hidden="true" size={20} /> : <Plus aria-hidden="true" size={20} />} onClose={closeAddRequirement} />
      <form className="mt-5 space-y-4" onSubmit={addRequirement}>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Requirement name
          <input autoFocus required maxLength={100} value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="e.g. Certificate of good moral character" className={fieldStyle} />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Details <span className="font-normal">(optional)</span>
          <textarea rows={3} maxLength={2000} value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} placeholder="Add a note about this requirement" className={`${fieldStyle} resize-y py-2.5`} />
        </label>
        <div className="flex justify-end gap-2 border-t border-slate-border pt-4 dark:border-dark-border">
          <Button type="button" variant="secondary" className="min-h-11" onClick={closeAddRequirement}>Cancel</Button>
          <Button type="submit" variant="primary" className="min-h-11" disabled={pending > 0}>{editingId ? <><Check aria-hidden="true" size={16} />Save changes</> : <><Plus aria-hidden="true" size={16} />Add requirement</>}</Button>
        </div>
      </form>
    </Dialog>}

    {deletingRequirement && <Dialog titleId="delete-requirement-title" onClose={closeDelete}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"><Trash2 aria-hidden="true" size={20} /></div>
        <div>
          <h2 id="delete-requirement-title" className="font-bold text-on-surface dark:text-slate-100">Delete &ldquo;{deletingRequirement.title}&rdquo;?</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">This removes the requirement, its status, and its note from this folder. Attached files are unlinked but stay in My Documents.</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-border pt-4 dark:border-dark-border">
        <Button type="button" variant="secondary" className="min-h-11" onClick={closeDelete} disabled={deleting}>Cancel</Button>
        <Button type="button" className="min-h-11 bg-red-600 text-white hover:bg-red-700" onClick={() => void confirmDelete()} isLoading={deleting}><Trash2 aria-hidden="true" size={16} />Delete requirement</Button>
      </div>
    </Dialog>}

    {attachTo && <Dialog titleId="document-picker-title" onClose={closePicker}>
      <DialogHeader id="document-picker-title" title="Attach a file" description={pickerRequirement ? `For ${pickerRequirement.title}` : undefined} icon={<Paperclip aria-hidden="true" size={20} />} onClose={closePicker} />
      <Button type="button" variant="primary" className="mt-5 min-h-11 w-full" onClick={startUpload}><Upload aria-hidden="true" size={16} />Upload a new file</Button>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Or choose from My Documents</p>
      {loadingDocs ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status"><LoaderCircle className="h-4 w-4 animate-spin" />Loading documents…</div> : documents.length ? <ul className="mt-2 flex flex-col gap-2">{documents.map((document) => {
        const already = getItem(attachTo).documentIds.includes(document.id);
        return <li key={document.id}><button type="button" disabled={already} onClick={() => attachDocument(document)} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-primary hover:bg-primary-soft/40 disabled:cursor-default disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-transparent dark:border-dark-border dark:hover:bg-dark-cardAlt ${focusRing}`}><FileText className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{document.originalName}</span><span className="block text-xs text-slate-500">{document.category}</span></span><span className="text-xs font-semibold text-primary">{already ? "Attached" : "Attach"}</span></button></li>;
      })}</ul> : <p className="py-6 text-center text-sm text-slate-500">No saved documents yet. Upload a new file above.</p>}
    </Dialog>}

    {uploadFor && <AddDocument onClose={() => setUploadFor(null)} onAdded={(document, warning) => void onUploaded(document, warning)} />}
  </div>;
}
