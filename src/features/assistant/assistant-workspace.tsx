"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileText, FolderOpen, MessageCircle, Plus, RotateCcw, Send, Square, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/lib/student-context";
import Link from "next/link";
import { DEFAULT_DOCUMENT_PROMPT } from "@/lib/ai/assistant-input";
import { AddDocument } from "@/features/documents/add-document";
import { ChatDocumentPicker, type ChatDocument } from "./chat-document-picker";

type Turn = { role: "user" | "assistant"; content: string; documents?: ChatDocument[]; reviewLinks?: { name: string; url: string }[]; usedTools?: string[] };
const toolLabels: Record<string, string> = { search_documents: "Searched documents", get_document: "Read document", classify_document: "Reviewed classification", get_checklist_requirements: "Checked requirements", check_document_processing: "Checked text extraction" };
export function AssistantWorkspace() {
  const { user } = useStudent();
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatDocument[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);
  useEffect(() => () => request.current?.abort(), []);
  function attach(record: ChatDocument) {
    setAttachments((current) => current.some((entry) => entry.id === record.id) ? current : [...current, record].slice(0, 3));
  }
  async function ask(history: Turn[]) {
    setBusy(true); setError(""); setNotice("");
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.map((entry) => ({ role: entry.role, content: entry.content, ...(entry.documents?.length ? { documentIds: entry.documents.map((document) => document.id) } : {}) })) }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(290000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to reach the local assistant.");
      if (!controller.signal.aborted) setMessages((current) => [...current, { role: "assistant", content: data.answer, reviewLinks: data.reviewLinks, usedTools: data.usedTools }]);
    } catch (reason) { if (request.current === controller) setError(controller.signal.aborted ? "Response stopped. Uploaded files remain in My Documents." : reason instanceof Error ? reason.message : "Local AI is unavailable."); }
    finally { if (request.current === controller) { setBusy(false); request.current = null; } }
  }
  async function submit(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const content = (prompt ?? input).trim() || (attachments.length ? DEFAULT_DOCUMENT_PROMPT : "");
    if (!content || busy) return;
    const history: Turn[] = [...messages, { role: "user" as const, content, ...(attachments.length ? { documents: attachments } : {}) }].slice(-20);
    setMessages(history); setInput(""); setAttachments([]);
    await ask(history);
  }
  return <section className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
    <header className="workspace-banner"><div><h1 className="text-2xl font-extrabold tracking-tight">ScholarReady Assistant</h1><p className="mt-2 text-sm text-on-surface-variant dark:text-slate-400">Send a document, ask a question, or get help with your scholarship checklist.</p></div><Button variant="secondary" disabled={busy || (!messages.length && !attachments.length)} onClick={() => { setMessages([]); setAttachments([]); setError(""); setNotice(""); }}><Plus size={16} />New conversation</Button></header>
    <div className="rounded-2xl border border-slate-border bg-white dark:border-dark-border dark:bg-dark-card">
      <div className="min-h-64 space-y-5 p-4 sm:p-6" aria-live="polite" aria-busy={busy}>
        {!messages.length && <div className="space-y-5 py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary dark:bg-dark-accentSurface dark:text-dark-accent"><MessageCircle size={28} /></span><h2 className="text-lg font-semibold">How can I help, {user?.profile?.firstName ?? "scholar"}?</h2><div className="mx-auto flex max-w-lg flex-wrap justify-center gap-2">{["Which documents can I use as proof of enrollment?", "Help me organize my uploaded documents", "What is on my scholarship checklist?"].map((prompt) => <button key={prompt} type="button" onClick={() => void submit(undefined, prompt)} className="rounded-xl border border-slate-border px-3 py-2 text-left text-xs hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary dark:border-dark-border dark:hover:bg-dark-cardAlt">{prompt}</button>)}</div></div>}
        {!messages.length && <p className="mx-auto max-w-md text-center text-sm text-slate-500">Attach a new or saved document below. You can send it without a question and I’ll inspect its text and suggest next steps.</p>}
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`min-w-0 max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-white" : "bg-surface-low dark:bg-dark-cardAlt"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{message.role === "user" ? "You" : "ScholarReady"}</p>
          {!!message.documents?.length && <div className="mb-3 space-y-2">{message.documents.map((document) => <Link key={document.id} href={`/documents?review=${document.id}`} className="flex items-center gap-2 rounded-lg border border-current/20 px-3 py-2 text-xs hover:underline"><FileText size={16} className="shrink-0" /><span className="truncate">{document.originalName}</span></Link>)}</div>}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {!!message.usedTools?.length && <p className="mt-3 text-[10px] opacity-70">{[...new Set(message.usedTools.map((name) => toolLabels[name]).filter(Boolean))].join(" · ")}</p>}
          {!!message.reviewLinks?.length && <div className="mt-3 flex flex-col gap-2">{message.reviewLinks.map((link) => <Link key={link.url} href={link.url} className="text-xs font-semibold text-primary underline dark:text-dark-accent">Review {link.name}</Link>)}</div>}</div></div>)}
        {busy && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Sparkles size={16} className="animate-pulse" />Thinking with local AI… The first response may take longer while the model loads.</p>}
        <div ref={bottom} />
      </div>
      {error && <div role="alert" className="mx-4 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"><p>{error}</p>{!busy && messages.at(-1)?.role === "user" && <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => void ask(messages.slice(-20))}><RotateCcw size={14} />Try again</Button>}</div>}
      {notice && <p role="status" className="mx-4 mb-4 rounded-lg bg-primary-soft p-3 text-sm text-primary-dark dark:bg-dark-accentSurface dark:text-dark-accent">{notice}</p>}
      <form onSubmit={submit} className="space-y-3 border-t border-slate-border p-4 dark:border-dark-border">
        {!!attachments.length && <div className="flex flex-wrap gap-2" aria-label="Documents attached to your next message">{attachments.map((document) => <div key={document.id} className="flex max-w-full items-center gap-2 rounded-xl border border-slate-border bg-surface-low py-2 pl-3 pr-1 dark:border-dark-border dark:bg-dark-cardAlt"><FileText size={17} className="shrink-0 text-primary dark:text-dark-accent" /><span className="min-w-0"><span className="block max-w-64 truncate text-xs font-medium">{document.originalName}</span><span className="block text-[10px] text-slate-500">{document.ocrStatus === "complete" ? "Ready to inspect" : document.ocrStatus === "pending" ? "Text extraction in progress" : "Saved · text extraction needs attention"}</span></span><button type="button" disabled={busy} aria-label={`Remove ${document.originalName} from message`} className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-surface-high dark:hover:bg-dark-card" onClick={() => setAttachments((current) => current.filter((entry) => entry.id !== document.id))}><X size={14} /></button></div>)}</div>}
        <label htmlFor="assistant-message" className="sr-only">Message the assistant</label><textarea id="assistant-message" value={input} maxLength={4000} rows={3} disabled={busy} onChange={(event) => setInput(event.target.value)} placeholder={attachments.length ? "What would you like to know? Leave blank and I’ll inspect your documents." : "Ask a question or attach a document…"} className="w-full resize-y rounded-xl border border-slate-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-dark-border dark:bg-dark-bg" />
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" size="sm" disabled={busy || attachments.length >= 3} onClick={() => setUploadOpen(true)}><Upload size={15} />Upload document</Button><Button type="button" variant="secondary" size="sm" disabled={busy || attachments.length >= 3} onClick={() => setPickerOpen(true)}><FolderOpen size={15} />My Documents</Button></div>{busy ? <Button type="button" variant="secondary" onClick={() => request.current?.abort()}><Square size={14} />Stop</Button> : <Button type="submit" disabled={!input.trim() && !attachments.length}><Send size={16} />Send</Button>}</div>
        <p className="text-[11px] leading-relaxed text-slate-500">Up to 3 documents per message. New uploads stay in My Documents and use Lumen OCR with your consent. AI can make mistakes; review suggestions before confirming. Chat history clears when you leave this page.</p>
      </form>
    </div>
    {uploadOpen && <AddDocument onClose={() => setUploadOpen(false)} onAdded={(document, warning) => { attach(document); setUploadOpen(false); setNotice(warning ?? "Saved to My Documents and attached to your message. Send it when you’re ready."); }} />}
    {pickerOpen && <ChatDocumentPicker selectedIds={attachments.map((document) => document.id)} onSelect={attach} onClose={() => setPickerOpen(false)} />}
  </section>;
}
