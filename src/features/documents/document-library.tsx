"use client";

import { FormEvent, useEffect, useState } from "react";
import type { StoredDocument } from "@/types/shared";

type SearchResult = StoredDocument & { snippet: string | null; matchType?: string; score?: number };
type ApiError = { error?: string };

export function DocumentLibrary() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("Loading documents…");
  const [previewDocument, setPreviewDocument] = useState<SearchResult | null>(null);

  async function load(search = "") {
    setMessage("Loading documents…");
    const response = await fetch(`/api/documents${search ? `?q=${encodeURIComponent(search)}` : ""}`);
    const payload = await response.json().catch(() => ({})) as { documents?: SearchResult[]; error?: string };
    if (!response.ok) { setDocuments([]); setMessage(payload.error ?? "Unable to load documents."); return; }
    setDocuments(payload.documents ?? []);
    setMessage(payload.documents?.length ? "" : search ? "No documents matched that search." : "No documents have been uploaded yet.");
  }

  async function deleteDocument(document: SearchResult) {
    if (!window.confirm(`Delete the local copy of ${document.originalName}? This does not delete Lumen's provider-side record.`)) return;
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) { const payload = await response.json().catch(() => ({})) as ApiError; setMessage(payload.error ?? "Unable to delete this document."); return; }
    if (previewDocument?.id === document.id) setPreviewDocument(null);
    setDocuments((current) => current.filter((item) => item.id !== document.id));
  }

  async function retryOcr(document: SearchResult) {
    const response = await fetch(`/api/documents/${document.id}/ocr/retry`, { method: "POST" });
    const payload = await response.json().catch(() => ({})) as { document?: SearchResult } & ApiError;
    if (!response.ok || !payload.document) { setMessage(payload.error ?? "Unable to retry OCR."); return; }
    setDocuments((current) => current.map((item) => item.id === document.id ? { ...payload.document!, snippet: null } : item));
    setMessage("OCR retry queued. Refresh this library shortly to check its status.");
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/documents")
      .then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { documents?: SearchResult[]; error?: string } }))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) { setDocuments([]); setMessage(payload.error ?? "Unable to load documents."); return; }
        setDocuments(payload.documents ?? []);
        setMessage(payload.documents?.length ? "" : "No documents have been uploaded yet.");
      })
      .catch(() => { if (active) setMessage("Unable to load documents."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = window.setTimeout(() => void load(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void load(query.trim()); }

  return <section className="card stack">
    <div><h1>My Documents</h1><p className="muted">Search document names and text extracted from your scans.</p></div>
    <form className="search" onSubmit={submit}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search OCR text, filename, or COR / OGR" aria-label="Search documents" /><button type="submit">Search</button><button type="button" className="secondary" onClick={() => { setQuery(""); void load(); }}>Clear</button></form>
    {message && <p className="muted" aria-live="polite">{message}</p>}
    <div className="document-list">{documents.map((document) => <article key={document.id} className="document-row"><div><strong>{document.originalName}</strong><p className="muted">{document.category} · {document.ocrStatus}{document.matchType && <span className="match-tag">{document.matchType.replace("_", " ")} match</span>}</p>{document.snippet && <p className="snippet">{document.snippet}</p>}</div><div className="row-actions"><time className="muted" dateTime={document.uploadedAt}>{new Date(document.uploadedAt).toLocaleDateString()}</time><button type="button" className="secondary" onClick={() => setPreviewDocument(document)}>View</button>{document.ocrStatus === "failed" && <button type="button" className="secondary" onClick={() => void retryOcr(document)}>Retry OCR</button>}<button type="button" className="danger" onClick={() => void deleteDocument(document)}>Delete</button></div></article>)}</div>
    {previewDocument && <DocumentPreview document={previewDocument} onClose={() => setPreviewDocument(null)} />}
  </section>;
}

function DocumentPreview({ document, onClose }: { document: SearchResult; onClose: () => void }) {
  const source = `/api/documents/${document.id}/file`;
  const canEmbed = document.mimeType === "application/pdf" || document.mimeType.startsWith("image/");
  return <section className="preview" aria-label={`Preview of ${document.originalName}`}>
    <div className="result-heading"><strong>{document.originalName}</strong><button type="button" className="secondary" onClick={onClose}>Close preview</button></div>
    {canEmbed ? document.mimeType === "application/pdf" ? <iframe className="file-preview" src={source} title={document.originalName} /> :
      // The local protected route cannot be optimized by Next's remote image pipeline.
      // eslint-disable-next-line @next/next/no-img-element
      <img className="image-preview" src={source} alt={`Preview of ${document.originalName}`} /> :
      <a href={source} target="_blank" rel="noreferrer">Open stored document</a>}
  </section>;
}
