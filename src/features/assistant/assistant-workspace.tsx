"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Plus, Send, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/lib/student-context";
import Link from "next/link";

type Turn = { role: "user" | "assistant"; content: string; reviewLinks?: { name: string; url: string }[] };
export function AssistantWorkspace() {
  const { user } = useStudent();
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);
  useEffect(() => () => request.current?.abort(), []);
  async function submit(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const content = (prompt ?? input).trim();
    if (!content || busy) return;
    const history: Turn[] = [...messages, { role: "user" as const, content }].slice(-20);
    setMessages(history); setInput(""); setBusy(true); setError("");
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(290000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to reach the local assistant.");
      setMessages((current) => [...current, { role: "assistant", content: data.answer, reviewLinks: data.reviewLinks }]);
    } catch (reason) { setError(controller.signal.aborted ? "Response stopped. Your documents were not confirmed or overwritten." : reason instanceof Error ? reason.message : "Local AI is unavailable."); }
    finally { setBusy(false); request.current = null; }
  }
  return <section className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
    <header className="workspace-banner"><div><h1 className="text-2xl font-extrabold tracking-tight">ScholarReady Assistant</h1><p className="mt-2 text-sm text-on-surface-variant dark:text-slate-400">Talk with local Qwen. Find documents, review classifications, or ask for scholarship preparation help.</p></div><Button variant="secondary" disabled={busy || !messages.length} onClick={() => { setMessages([]); setError(""); }}><Plus size={16} />New conversation</Button></header>
    <div className="rounded-2xl border border-slate-border bg-white dark:border-dark-border dark:bg-dark-card">
      <div className="min-h-64 space-y-5 p-4 sm:p-6" aria-live="polite" aria-busy={busy}>
        {!messages.length && <div className="space-y-5 py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary dark:bg-dark-accentSurface dark:text-dark-accent"><MessageCircle size={28} /></span><h2 className="text-lg font-semibold">How can I help, {user?.profile?.firstName ?? "scholar"}?</h2><div className="mx-auto flex max-w-lg flex-wrap justify-center gap-2">{["Which documents can I use as proof of enrollment?", "Help me organize my uploaded documents", "What is on my scholarship checklist?"].map((prompt) => <button key={prompt} type="button" onClick={() => void submit(undefined, prompt)} className="rounded-xl border border-slate-border px-3 py-2 text-left text-xs hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary dark:border-dark-border dark:hover:bg-dark-cardAlt">{prompt}</button>)}</div></div>}
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-white" : "bg-surface-low dark:bg-dark-cardAlt"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{message.role === "user" ? "You" : "ScholarReady"}</p><p className="whitespace-pre-wrap break-words">{message.content}</p>{!!message.reviewLinks?.length && <div className="mt-3 flex flex-col gap-2">{message.reviewLinks.map((link) => <Link key={link.url} href={link.url} className="text-xs font-semibold text-primary underline dark:text-dark-accent">Review {link.name}</Link>)}</div>}</div></div>)}
        {busy && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Sparkles size={16} className="animate-pulse" />Thinking with local AI… The first response may take longer while the model loads.</p>}
        <div ref={bottom} />
      </div>
      {error && <p role="alert" className="mx-4 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      <form onSubmit={submit} className="border-t border-slate-border p-4 dark:border-dark-border"><label htmlFor="assistant-message" className="sr-only">Message the assistant</label><textarea id="assistant-message" value={input} maxLength={4000} rows={3} disabled={busy} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your documents, or just start a conversation…" className="w-full resize-y rounded-xl border border-slate-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-dark-border dark:bg-dark-bg" /><div className="mt-3 flex items-center justify-between gap-3"><p className="max-w-md text-[11px] leading-relaxed text-slate-500">AI can make mistakes. Check original documents and official requirements. This conversation stays in memory while the page is open.</p>{busy ? <Button type="button" variant="secondary" onClick={() => request.current?.abort()}><Square size={14} />Stop</Button> : <Button type="submit" disabled={!input.trim()}><Send size={16} />Send</Button>}</div></form>
    </div>
  </section>;
}
