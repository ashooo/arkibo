"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCheck, FileText, FolderOpen, Plus, ScanText, ShieldCheck, Sparkles } from "lucide-react";
import { ScholarMascot } from "@/components/ui/scholar-mascot";
import { Button } from "@/components/ui/button";

export function UploadSuccess({ name = "Certificate of Enrollment.pdf", warning, demo = false, onLibrary, onUpload }: { name?: string; warning?: string; demo?: boolean; onLibrary?: () => void; onUpload?: () => void }) {
  return <section className="mx-auto max-w-5xl py-5 sm:py-10">
    <div className="mb-8 flex items-center justify-between gap-3 text-xs font-medium text-on-surface-variant dark:text-dark-muted">
      <span className="flex items-center gap-2"><FolderOpen size={16} /> My Documents <span className="opacity-40">/</span> Upload complete</span>
      {demo && <span className="rounded-full border border-slate-border px-3 py-1 dark:border-dark-border">Sample preview</span>}
    </div>
    <div className="overflow-hidden rounded-[2rem] border border-slate-border bg-surface-lowest shadow-xl shadow-black/5 dark:border-dark-border dark:bg-dark-card">
      <div className="relative overflow-hidden border-b border-slate-border bg-primary-soft px-6 pb-10 pt-12 text-center dark:border-dark-border dark:bg-dark-cardAlt sm:px-12 sm:pb-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 size-80 rounded-full border border-primary/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-20 size-60 rounded-full border border-primary/10" />
        <div className="relative mx-auto mb-6 grid size-20 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/15 ring-8 ring-primary/10 dark:bg-dark-accent dark:text-dark-bg"><Check strokeWidth={3} size={36} /></div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary dark:text-dark-accent">A little less paperwork.</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">One step closer. Nicely done.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-on-surface-variant dark:text-dark-muted">Your document has a home in Arkibo. Keep building your collection, one file at a time.</p>
      </div>
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold">Your upload</h2><span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary dark:bg-dark-accentSurface dark:text-dark-accent"><CheckCheck size={14} />{demo ? "Sample document" : "Saved to library"}</span></div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-border bg-surface p-5 dark:border-dark-border dark:bg-dark-surface">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface-lowest text-primary dark:bg-dark-card dark:text-dark-accent"><FileText size={27} strokeWidth={1.5} /></span>
            <div className="min-w-0"><p className="break-words text-sm font-semibold">{name}</p><p className="mt-1 text-xs text-on-surface-variant dark:text-dark-muted">{demo ? "PDF document · Example upload" : "Original document uploaded"}</p></div>
          </div>
          <div className="mt-6 space-y-5">
            <div className="flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary dark:bg-dark-accentSurface dark:text-dark-accent"><Check size={14} /></span><div><h3 className="text-sm font-semibold">Original kept intact</h3><p className="mt-1 text-xs leading-6 text-on-surface-variant dark:text-dark-muted">Find your file anytime in My Documents.</p></div></div>
            <div className="flex gap-3"><ScanText size={21} className="mt-1 shrink-0 text-primary dark:text-dark-accent" /><div><h3 className="text-sm font-semibold">Next up: text extraction</h3><p className="mt-1 text-xs leading-6 text-on-surface-variant dark:text-dark-muted">Check processing status in your library. Once ready, words inside your file become searchable.</p></div></div>
          </div>
          {warning && <p role="status" className="mt-5 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-6">{warning}</p>}
        </div>
        <aside className="flex flex-col justify-center rounded-2xl bg-surface p-6 dark:bg-dark-surface">
          {demo && <div className="mb-5">
            <div className="mb-3 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant dark:text-dark-muted"><span>File preview</span><span>1 / 1</span></div>
            <div className="relative rotate-[-2deg] rounded-sm bg-white px-7 py-8 text-slate-800 shadow-lg">
              <div className="border-b-2 border-emerald-800 pb-4 text-center"><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-800">Arkibo Learning Academy</p><p className="mt-1 text-[7px] text-slate-400">Pasig City, Philippines · Sample institution</p></div>
              <h3 className="mt-5 text-center font-serif text-sm font-bold">Certificate of Enrollment</h3>
              <p className="mt-2 text-center text-[8px] uppercase tracking-wider text-slate-400">Academic Year 2026–2027</p>
              <p className="mt-5 text-[9px] leading-5">This is to certify that <strong>Alex Dela Cruz</strong> is enrolled in Grade 12 for the current academic year.</p>
              <div className="mt-5 space-y-2">{[100, 90, 100, 65].map((width, index) => <div key={index} className="h-1 rounded bg-slate-100" style={{ width: `${width}%` }} />)}</div>
              <div className="mt-6 flex items-end justify-between"><span className="rounded border border-emerald-700/30 px-2 py-1 text-[7px] font-bold uppercase text-emerald-800">Sample only</span><span className="border-t border-slate-300 px-4 pt-1 text-[7px] text-slate-400">Office of the Registrar</span></div>
            </div>
          </div>}
          <div className="flex items-center gap-4"><ScholarMascot size={70} /><span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary dark:bg-dark-accentSurface dark:text-dark-accent">You’ve got this.</span></div>
          <h2 className="mt-5 text-lg font-bold">Good things start with<br />getting organized.</h2>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant dark:text-dark-muted">Review your document’s category and suggested tags in the library to make it easier to find later.</p>
          <p className="mt-5 flex items-center gap-2 text-xs font-medium text-primary dark:text-dark-accent"><Sparkles size={15} /> A clearer path to your next application.</p>
        </aside>
      </div>
      <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-slate-border px-6 py-6 dark:border-dark-border sm:flex-row sm:items-center sm:px-10">
        <p className="flex items-center justify-center gap-2 text-xs text-on-surface-variant dark:text-dark-muted"><ShieldCheck size={16} />{demo ? "Preview only · No document was uploaded" : "Available in your account’s document library"}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {onUpload ? <Button variant="secondary" onClick={onUpload}><Plus size={16} />Upload another</Button> : <Link href="/documents?add=1" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-border px-5 text-sm font-semibold dark:border-dark-border"><Plus size={16} />Upload another</Link>}
          {onLibrary ? <Button onClick={onLibrary}>Go to my documents<ArrowRight size={16} /></Button> : <Link href="/documents" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white">Go to my documents<ArrowRight size={16} /></Link>}
        </div>
      </div>
    </div>
  </section>;
}
