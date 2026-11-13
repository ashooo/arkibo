"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { FileText, MoreVertical, RefreshCw, Tags, Trash2 } from "lucide-react";
import type { StoredDocument } from "@/types/shared";
import { categoryLabel } from "./document-ui";
import styles from "./document-card.module.css";

export function DocumentCard({ document, busy, onRemove, onStatus, onReview }: { document: StoredDocument; busy: boolean; onRemove: () => void; onStatus: () => void; onReview: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menu = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const focusLast = useRef(false);
  useEffect(() => {
    if (!open) return;
    const buttons = menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    buttons?.[focusLast.current ? buttons.length - 1 : 0]?.focus();
    function outside(event: PointerEvent) { if (!actions.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: globalThis.KeyboardEvent) { if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }
    window.document.addEventListener("pointerdown", outside);
    window.document.addEventListener("keydown", escape);
    return () => { window.document.removeEventListener("pointerdown", outside); window.document.removeEventListener("keydown", escape); };
  }, [open]);
  function navigateMenu(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(window.document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
  }
  function select(action: () => void) { setOpen(false); trigger.current?.focus(); action(); }
  const source = `/api/documents/${document.id}/file`;
  const image = ["image/png", "image/jpeg", "image/webp"].includes(document.mimeType);
  const pdf = document.mimeType === "application/pdf";
  return <li className={`${styles.card} group overflow-hidden rounded-xl border border-slate-border bg-white transition-shadow hover:shadow-card dark:border-dark-border dark:bg-dark-card`}>
    <a href={source} target="_blank" rel="noreferrer" aria-label={`Open ${document.originalName}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
      <div aria-hidden="true" className="relative aspect-[4/5] overflow-hidden border-b border-slate-border bg-white dark:border-dark-border">
        {image && !imageFailed ? (
          // Thumbnails use the protected account route without Next image optimization.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={source} alt="" loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.02]" />
        ) : pdf ? <iframe src={`${source}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`} title={`Thumbnail of ${document.originalName}`} loading="lazy" tabIndex={-1} className="pointer-events-none h-full w-full border-0 bg-white" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400"><FileText size={64} strokeWidth={1} /><span className="text-xs font-semibold uppercase tracking-wider">{document.mimeType.split("/")[1] || "Document"}</span></div>}
      </div>
    </a>
    <div className="relative px-3 py-2.5">
      <h2 className="truncate pr-7 text-[13px] font-medium leading-5" title={document.originalName}><a href={source} target="_blank" rel="noreferrer" className="hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary dark:hover:text-dark-accent">{document.originalName}</a></h2>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400"><FileText size={12} aria-hidden="true" className="shrink-0 text-primary dark:text-dark-accent" /><span className="min-w-0 truncate">{categoryLabel(document.category)}</span><span aria-hidden="true">·</span><time dateTime={document.uploadedAt} className="shrink-0">{new Date(document.uploadedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</time></div>
      {document.ocrStatus !== "complete" && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{document.ocrStatus === "pending" ? "Processing…" : "Needs attention"}</p>}
      {!!document.tags?.length && <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400" title={document.tags.join(", ")}>{document.tags.slice(0, 2).join(" · ")}{document.tags.length > 2 ? ` +${document.tags.length - 2}` : ""}</p>}
      {document.ocrStatus === "complete" && !document.classificationConfirmedAt && <button type="button" onClick={onReview} className="mt-1 text-[10px] text-primary hover:underline dark:text-dark-accent">{document.classificationStatus === "processing" ? "Categorizing…" : document.classificationStatus === "ready" ? "AI suggestion · review" : "Needs review"}</button>}
      <div ref={actions} className="absolute right-1.5 top-1.5">
        <button ref={trigger} type="button" disabled={busy} aria-label={`Actions for ${document.originalName}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => { focusLast.current = false; setOpen((value) => !value); }} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); focusLast.current = event.key === "ArrowUp"; setOpen(true); } }} className={`${styles.trigger} grid size-8 place-items-center rounded-md text-slate-500 transition-opacity hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 dark:text-slate-400 dark:hover:bg-dark-cardAlt`}><MoreVertical size={17} /></button>
        {open && <div ref={menu} id={menuId} role="menu" aria-label={`Actions for ${document.originalName}`} onKeyDown={navigateMenu} onBlur={(event) => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setOpen(false); }} className="absolute bottom-full right-0 z-10 mb-1 w-40 rounded-lg border border-slate-border bg-white p-1 shadow-lg dark:border-dark-border dark:bg-dark-card">
          <button type="button" role="menuitem" onClick={() => select(onReview)} className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-xs hover:bg-surface-low focus:bg-surface-low focus:outline-none dark:hover:bg-dark-cardAlt dark:focus:bg-dark-cardAlt"><Tags size={14} />Category & tags</button>
          {document.ocrStatus !== "complete" && <button type="button" role="menuitem" disabled={busy} onClick={() => select(onStatus)} className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-xs hover:bg-surface-low focus:bg-surface-low focus:outline-none dark:hover:bg-dark-cardAlt dark:focus:bg-dark-cardAlt"><RefreshCw size={14} />{document.ocrStatus === "failed" ? "Retry extraction" : "Check status"}</button>}
          <button type="button" role="menuitem" disabled={busy} onClick={() => select(onRemove)} className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-xs text-red-700 hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:text-red-300 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40"><Trash2 size={14} />Delete</button>
        </div>}
      </div>
    </div>
  </li>;
}
