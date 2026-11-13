"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X, CheckCircle2, LoaderCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StoredDocument } from "@/types/shared";
import { documentCategories } from "@/lib/ai/document-classification";

export const categories = { ...documentCategories, enrollment_proof: "Enrollment proof (legacy)", ogr: "Grade report (legacy)" };
export function categoryLabel(value: string) { return categories[value as keyof typeof categories] ?? value; }
export const inputStyle = "min-h-11 w-full rounded-lg border border-slate-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-card dark:text-slate-100";

export function DocumentStatus({ status }: { status: StoredDocument["ocrStatus"] }) {
  const Icon = status === "complete" ? CheckCircle2 : status === "pending" ? LoaderCircle : AlertCircle;
  return <Badge variant={status === "complete" ? "success" : status === "pending" ? "primary" : "warning"}><Icon size={13} aria-hidden="true" className={status === "pending" ? "animate-spin" : ""} />{status === "complete" ? "Searchable" : status === "pending" ? "Extracting text" : "Needs attention"}</Badge>;
}

export function DocumentDialog({ title, description, children, onClose, busy = false, wide = false }: { title: string; description?: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = window.document.activeElement;
    const previous = window.document.body.style.overflow;
    dialog?.showModal();
    window.document.body.style.overflow = "hidden";
    return () => { dialog?.close(); window.document.body.style.overflow = previous; if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="document-dialog-title" aria-describedby={description ? "document-dialog-description" : undefined} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }} className={`max-h-[90dvh] w-[calc(100%-2rem)] rounded-2xl border border-slate-border bg-white p-0 text-on-surface shadow-2xl backdrop:bg-slate-950/50 dark:border-dark-border dark:bg-dark-card dark:text-slate-100 ${wide ? "max-w-6xl" : "max-w-xl"}`}>
    <div className="flex items-start justify-between gap-4 border-b border-slate-border px-5 py-5 dark:border-dark-border sm:px-6"><div className="min-w-0"><h2 id="document-dialog-title" className="break-words text-xl font-bold tracking-tight">{title}</h2>{description && <p id="document-dialog-description" className="mt-1 text-sm text-on-surface-variant dark:text-slate-400">{description}</p>}</div><button type="button" disabled={busy} onClick={onClose} aria-label="Close dialog" className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 dark:hover:bg-dark-cardAlt"><X size={20} /></button></div>
    {children}
  </dialog>;
}
