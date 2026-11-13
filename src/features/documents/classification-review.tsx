"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredDocument } from "@/types/shared";
import { documentCategories, isDocumentCategory } from "@/lib/ai/document-classification";
import type { RequirementCandidate } from "@/lib/ai/document-classification";
import { DocumentDialog, inputStyle } from "./document-ui";

export function ClassificationReview({ documentId, onClose, onUpdated }: { documentId: string; onClose: () => void; onUpdated: (document: StoredDocument) => void }) {
  const [record, setRecord] = useState<StoredDocument | null>(null);
  const [requirements, setRequirements] = useState<RequirementCandidate[]>([]);
  const [category, setCategory] = useState("unclassified");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const alive = useRef(true);
  const analysisRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void fetch(`/api/documents/${documentId}/classification`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load document details.");
      if (!controller.signal.aborted) { setRecord(data.document); setRequirements(data.requirements); setCategory(isDocumentCategory(data.document.category) ? data.document.category : "unclassified"); setTags(data.document.tags.join(", ")); }
    }).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => { alive.current = false; controller.abort(); analysisRequest.current?.abort(); };
  }, [documentId]);
  async function analyze() {
    setAnalyzing(true); setError(""); setNotice("");
    const controller = new AbortController(); analysisRequest.current = controller;
    try {
      const response = await fetch(`/api/documents/${documentId}/classification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: true }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(200000)]) });
      const data = await response.json();
      if (!alive.current) return;
      if (!response.ok || !data.document) throw new Error(data.error ?? "Unable to analyze document.");
      setRecord(data.document); onUpdated(data.document);
      if (!dirty.current) { setCategory(data.document.category); setTags(data.document.tags.join(", ")); }
      if (data.document.classificationError) setError(data.document.classificationError);
      else setNotice(data.document.classificationConfirmedAt ? "Analysis refreshed. Your confirmed category and tags were preserved; review the new suggestion below." : "Analysis complete. Review the suggestion, then confirm or edit it.");
    } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : "Local AI is unavailable. You can still edit manually."); }
    finally { if (alive.current) setAnalyzing(false); analysisRequest.current = null; }
  }
  async function confirm() {
    if (!record) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/documents/${documentId}/classification`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), expectedVersion: record.metadataVersion }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save classification.");
      setRecord(data.document); onUpdated(data.document); dirty.current = false; setNotice("Category and tags confirmed. AI will not overwrite them.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save changes."); }
    finally { setSaving(false); }
  }
  async function attach(id: string) {
    const match = requirements.find((entry) => entry.id === id);
    if (!match?.listId) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/checklist/${encodeURIComponent(id)}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listId: match.listId, documentId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to attach document.");
      setNotice("Attached to the checklist. This does not mark the requirement as prepared or approved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to attach document."); }
    finally { setSaving(false); }
  }
  const suggestion = record?.classification;
  const suggestionDiffers = suggestion && record && (suggestion.category !== record.category || JSON.stringify(suggestion.tags) !== JSON.stringify(record.tags));
  const matches = suggestion && (!record?.classificationConfirmedAt || record.category === suggestion.category) ? requirements.filter((entry) => suggestion.suggestedRequirementIds.includes(entry.id)) : [];
  return <DocumentDialog title="Document details" description={record?.originalName ?? "Loading document…"} onClose={onClose} busy={saving}>
    <div className="space-y-5 p-5 sm:p-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-primary-dark dark:bg-dark-accentSurface dark:text-dark-accent">{notice}</p>}
      {record && <>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{record.classificationConfirmedAt ? "You confirmed this classification." : "AI categories and tags are suggestions until you confirm them."} Classification does not guarantee acceptance by a scholarship office.</p>
        {record.classificationError && !error && <p className="text-sm text-amber-700 dark:text-amber-300">{record.classificationError}</p>}
        <label className="block space-y-2 text-sm font-semibold"><span>Document type</span><select className={inputStyle} value={category} onChange={(event) => { dirty.current = true; setCategory(event.target.value); }}>{Object.entries(documentCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block space-y-2 text-sm font-semibold"><span>Tags</span><input className={inputStyle} value={tags} maxLength={1000} onChange={(event) => { dirty.current = true; setTags(event.target.value); }} placeholder="Enrollment, Academic Year 2026-2027" /><span className="block text-xs font-normal text-slate-500">Separate tags with commas. Up to 16 tags.</span></label>
        {suggestion && record.classificationConfirmedAt && suggestionDiffers && <div className="rounded-lg border border-slate-border p-3 text-sm dark:border-dark-border"><p className="font-semibold">AI suggestion: {documentCategories[suggestion.category]}</p><p className="mt-1 text-xs text-slate-500">{suggestion.tags.join(" · ") || "No suggested tags"}</p><p className="mt-1 text-xs text-slate-500">Your confirmed values have not changed.</p><Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => { dirty.current = true; setCategory(suggestion.category); setTags(suggestion.tags.join(", ")); }}>Use suggestion in form</Button></div>}
        <div className="flex flex-wrap gap-2"><Button variant="secondary" isLoading={analyzing} disabled={record.ocrStatus !== "complete" || saving} onClick={() => void analyze()}><Sparkles size={16} />Analyze again</Button><Button isLoading={saving} onClick={() => void confirm()}>Confirm category & tags</Button></div>
        {record.ocrStatus !== "complete" && <p className="text-xs text-slate-500">AI analysis becomes available after OCR finishes. Manual categorization is available now.</p>}
        {!!matches.length && <section className="space-y-3 border-t border-slate-border pt-4 dark:border-dark-border"><h3 className="text-sm font-semibold">Possible checklist matches</h3><p className="text-xs text-slate-500">Suggestions for your application folders. Review the original before attaching.</p>{matches.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3 dark:bg-dark-cardAlt"><span className="min-w-0"><span className="block text-sm">{entry.title}</span><span className="block text-xs text-slate-500">{entry.listName}</span></span><Button variant="secondary" size="sm" disabled={saving} onClick={() => void attach(entry.id)}><Link2 size={14} />Attach</Button></div>)}</section>}
      </>}
    </div>
  </DocumentDialog>;
}
