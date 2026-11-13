"use client";

import { ScholarMascot } from "@/components/ui/scholar-mascot";
import Link from "next/link";
import { ChartNoAxesColumnIncreasing, ChevronDown, FileText, Sparkles } from "lucide-react";

import { FormEvent, useEffect, useState } from "react";
import type { AcademicTerm, GradeEntry, StoredDocument, StudentProfile } from "@/types/shared";

type ApiError = { error?: string };
type GradeDraft = { subjectCode: string; subjectName: string; grade: string };

export function GradeHistory() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [studentId, setStudentId] = useState("");
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [sourceDocuments, setSourceDocuments] = useState<StoredDocument[]>([]);
  const [sourceDocumentId, setSourceDocumentId] = useState("");
  const [drafts, setDrafts] = useState<GradeDraft[]>([]);
  const [message, setMessage] = useState("Loading your account profile…");

  useEffect(() => {
    void fetch("/api/students").then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { students?: StudentProfile[] } & ApiError })).then(({ response, payload }) => {
      if (!response.ok) { setMessage(payload.error ?? "Unable to load profiles."); return; }
      setProfiles(payload.students ?? []);
      if (payload.students?.[0]) { setStudentId(payload.students[0].id); setMessage(""); }
    }).catch(() => setMessage("Unable to load profiles."));
  }, []);

  useEffect(() => {
    void fetch("/api/documents").then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { documents?: StoredDocument[] } & ApiError })).then(({ response, payload }) => {
      if (!response.ok) return;
      setSourceDocuments((payload.documents ?? []).filter((document) => document.ocrStatus === "complete" && Boolean(document.ocrText)));
    });
  }, []);

  useEffect(() => {
    if (!studentId) return;
    void fetch(`/api/terms?studentId=${encodeURIComponent(studentId)}`).then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { terms?: AcademicTerm[] } & ApiError })).then(({ response, payload }) => {
      if (!response.ok) { setMessage(payload.error ?? "Unable to load terms."); return; }
      setTerms(payload.terms ?? []);
      setTermId((current) => current || payload.terms?.[0]?.id || "");
    }).catch(() => setMessage("Unable to load terms."));
  }, [studentId]);

  useEffect(() => {
    if (!termId) return;
    void fetch(`/api/grades?termId=${encodeURIComponent(termId)}`).then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { grades?: GradeEntry[] } & ApiError })).then(({ response, payload }) => {
      if (!response.ok) { setMessage(payload.error ?? "Unable to load grades."); return; }
      setGrades(payload.grades ?? []);
    }).catch(() => setMessage("Unable to load grades."));
  }, [termId]);

  async function createTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!studentId) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/terms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, academicYear: form.get("academicYear"), semester: form.get("semester") }) });
    const payload = await response.json().catch(() => ({})) as { term?: AcademicTerm } & ApiError;
    if (!response.ok || !payload.term) { setMessage(payload.error ?? "Unable to create term."); return; }
    setTerms((current) => [...current, payload.term!]); setTermId(payload.term.id); setGrades([]); setMessage(""); event.currentTarget.reset();
  }

  async function saveGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!termId) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/grades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ termId, sourceDocumentId: sourceDocumentId || undefined, subjectCode: form.get("subjectCode"), subjectName: form.get("subjectName"), grade: form.get("grade"), verified: form.get("verified") === "on" }) });
    const payload = await response.json().catch(() => ({})) as { grade?: GradeEntry } & ApiError;
    if (!response.ok || !payload.grade) { setMessage(payload.error ?? "Unable to save grade."); return; }
    setGrades((current) => [...current, payload.grade!]); setMessage(""); event.currentTarget.reset();
  }

  async function toggleVerification(entry: GradeEntry) {
    const response = await fetch("/api/grades", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: entry.id, verified: !entry.verified }) });
    const payload = await response.json().catch(() => ({})) as { grade?: GradeEntry } & ApiError;
    if (!response.ok || !payload.grade) { setMessage(payload.error ?? "Unable to update grade."); return; }
    setGrades((current) => current.map((grade) => grade.id === payload.grade!.id ? payload.grade! : grade));
  }

  async function createDrafts() {
    if (!sourceDocumentId) return;
    const response = await fetch("/api/grades/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: sourceDocumentId }) });
    const payload = await response.json().catch(() => ({})) as { drafts?: GradeDraft[] } & ApiError;
    if (!response.ok) { setMessage(payload.error ?? "Unable to generate grade drafts."); return; }
    setDrafts(payload.drafts ?? []);
    setMessage(payload.drafts?.length ? "Review each suggested row, then add it manually below." : "No grade rows were confidently detected. Add entries manually.");
  }

  return <section className="grade-workspace stack min-w-0 w-full grid-cols-1">
    <header className="flex items-center gap-4">
      <span className="feature-icon" data-tone="gold"><ChartNoAxesColumnIncreasing aria-hidden="true" /></span>
      <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Grade History</h1>
      <p className="muted mt-1">{profiles[0]?.displayName}{profiles[0] && (profiles[0].applicationType === "renewal" ? " · Renewal Scholar" : " · New Applicant")}</p></div>
    </header>
    <p className="grade-tip"><Sparkles size={20} aria-hidden="true" /> OCR can help you read an OGR, but you must review every row before marking it verified.</p>
    {message && <p className="notice" aria-live="polite">{message}</p>}
    {studentId && <><form className="grade-panel stack" onSubmit={createTerm}>
      <h2 className="text-lg font-semibold">Create an academic term</h2>
      <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="field">Academic year<input name="academicYear" placeholder="e.g. 2026–2027" required /></label>
        <label className="field">Semester<input name="semester" placeholder="e.g. First Semester" required /></label>
        <button className="grade-action">Create term</button>
      </div>
    </form>
    <label className="grade-panel field min-w-0 w-full grid-cols-1"><span>Academic term</span><span className="relative block w-full min-w-0"><select className="block w-full min-w-0 max-w-full !appearance-none truncate !pr-10" value={termId} onChange={(event) => { setTermId(event.target.value); setGrades([]); }}><option value="">Select a term</option>{terms.map((term) => <option key={term.id} value={term.id}>{term.academicYear} · {term.semester}</option>)}</select><ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" /></span></label></>}
    {!termId && <div className="grade-panel grid justify-items-center gap-3 py-10 text-center">
      <ScholarMascot size={88} />
      <h2 className="text-2xl font-semibold">No grades yet</h2>
      <p className="muted">Create or select a term to review your grades.</p>
      <Link className="grade-action inline-flex items-center gap-2" href="/scanner"><FileText size={18} aria-hidden="true" /> Scan an OGR</Link>
    </div>}
    {termId && <><label className="field"><span>Optional OGR source</span><select value={sourceDocumentId} onChange={(event) => setSourceDocumentId(event.target.value)}><option value="">Manual entry — no source document</option>{sourceDocuments.map((document) => <option key={document.id} value={document.id}>{document.originalName}</option>)}</select></label>
      {sourceDocumentId && <><button type="button" className="secondary" onClick={() => void createDrafts()}>Suggest grade rows from OCR</button><pre className="ocr-text">{sourceDocuments.find((document) => document.id === sourceDocumentId)?.ocrText}</pre></>}
      {drafts.length > 0 && <section className="draft-list"><h2>Unverified suggestions</h2>{drafts.map((draft) => <p key={`${draft.subjectCode}-${draft.subjectName}`}><strong>{draft.subjectCode}</strong> — {draft.subjectName} <span className="muted">({draft.grade})</span></p>)}</section>}
      <form className="inline-form" onSubmit={saveGrade}><input name="subjectCode" placeholder="Subject code" required /><input name="subjectName" placeholder="Subject name" required /><input name="grade" placeholder="Grade" required /><label className="check-label"><input name="verified" type="checkbox" /> Verified</label><button>Save grade</button></form>
      <div className="document-list">{grades.map((entry) => <article key={entry.id} className="document-row"><div><strong>{entry.subjectCode} — {entry.subjectName}</strong><p className="muted">Grade: {entry.grade}</p></div><button type="button" className={entry.verified ? "secondary" : ""} onClick={() => void toggleVerification(entry)}>{entry.verified ? "Verified" : "Mark verified"}</button></article>)}</div></>}
  </section>;
}
