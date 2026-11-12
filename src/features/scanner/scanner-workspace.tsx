"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { StoredDocument } from "@/types/shared";

const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 12;

type ApiError = { error?: string };

export function ScannerWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("others");
  const [consented, setConsented] = useState(false);
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!document || document.ocrStatus !== "pending") return;
    const timer = window.setInterval(async () => {
      if (pollCount.current >= MAX_POLLS) {
        window.clearInterval(timer);
        setMessage("OCR is still processing. Use Refresh status in a moment to check again.");
        return;
      }
      pollCount.current += 1;
      const response = await fetch(`/api/documents/${document.id}/ocr`, { method: "POST" });
      const payload = await response.json().catch(() => ({})) as { document?: StoredDocument } & ApiError;
      if (payload.document) setDocument(payload.document);
      if (!response.ok) setMessage(payload.error ?? "Unable to refresh OCR status.");
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [document]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !consented) return;
    setIsUploading(true);
    setMessage(null);
    pollCount.current = 0;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("category", category);
    const response = await fetch("/api/documents", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({})) as { document?: StoredDocument } & ApiError;
    setIsUploading(false);
    if (payload.document) setDocument(payload.document);
    if (!response.ok) setMessage(payload.error ?? "Upload failed. Please try again.");
  }

  async function refreshStatus() {
    if (!document) return;
    setMessage(null);
    const response = await fetch(`/api/documents/${document.id}/ocr`, { method: "POST" });
    const payload = await response.json().catch(() => ({})) as { document?: StoredDocument } & ApiError;
    if (payload.document) setDocument(payload.document);
    if (!response.ok) setMessage(payload.error ?? "Unable to refresh OCR status.");
  }

  return (
    <section className="card stack">
      <div>
        <h1>Document Scanner</h1>
        <p className="muted">Upload a PDF or image to store it locally and extract searchable text with Lumen OCR.</p>
      </div>

      <form className="stack" onSubmit={submit}>
        <label className="field">
          <span>Document</span>
          <input type="file" accept="application/pdf,image/png,image/jpeg,image/tiff,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
          <small>PDF, PNG, JPEG, TIFF, or WebP; maximum 10 MiB.</small>
        </label>
        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ogr">OGR</option><option value="student_id">Student ID</option><option value="enrollment_proof">Enrollment proof</option><option value="others">Other</option>
          </select>
        </label>
        <label className="consent">
          <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} />
          <span>I understand this document will be sent to Lumen OCR for text extraction. I will upload only documents I am authorized to share.</span>
        </label>
        <button type="submit" disabled={!file || !consented || isUploading}>{isUploading ? "Uploading…" : "Upload and scan"}</button>
      </form>

      {message && <p className="notice error" role="alert">{message}</p>}
      {document && <ScanResult document={document} onRefresh={refreshStatus} />}
    </section>
  );
}

function ScanResult({ document, onRefresh }: { document: StoredDocument; onRefresh: () => void }) {
  const label = document.ocrStatus === "complete" ? "OCR complete" : document.ocrStatus === "failed" ? "OCR failed" : "OCR processing";
  return <section className="scan-result" aria-live="polite">
    <div className="result-heading"><div><strong>{label}</strong><p className="muted">{document.originalName}</p></div>{document.ocrStatus === "pending" && <button type="button" className="secondary" onClick={onRefresh}>Refresh status</button>}</div>
    {document.ocrError && <p className="notice error">{document.ocrError}</p>}
    {document.ocrText && <><h2>Extracted text</h2><pre className="ocr-text">{document.ocrText}</pre></>}
    {document.ocrStatus === "pending" && <p className="muted">Checking Lumen OCR every few seconds. Status checks may use API credits.</p>}
  </section>;
}
