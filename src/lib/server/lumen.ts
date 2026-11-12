import { validateUpload } from "./uploads";

type LumenEnvelope<T> = { data: T; requestId: string };
type LumenDocument = { DocumentID: string; Status: string; FailureReason?: string };
type LumenWord = { Text?: string; Value?: string; text?: string };
type LumenLine = { Text?: string; text?: string; Words?: LumenWord[]; words?: LumenWord[] };
type LumenPage = {
  Text?: string;
  RecognizedText?: string;
  Content?: string;
  text?: string;
  Words?: LumenWord[];
  words?: LumenWord[];
  Lines?: LumenLine[];
  lines?: LumenLine[];
};
const FINAL_SUCCESS_STATUSES = new Set(["READY", "PARTIAL"]);

export class LumenError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) { super(message); }
}

function settings() {
  const baseUrl = process.env.LUMEN_API_BASE_URL;
  const ocrPath = process.env.LUMEN_OCR_PATH;
  const apiKey = process.env.LUMEN_API_KEY;
  const apiSecret = process.env.LUMEN_API_SECRET;
  if (!baseUrl || !ocrPath || !apiKey || !apiSecret) throw new LumenError(500, "Lumen OCR is not configured on the server.");
  return { endpoint: new URL(ocrPath, baseUrl).toString().replace(/\/$/, ""), apiKey, apiSecret };
}

async function lumenFetch<T>(url: string, init: RequestInit = {}) {
  const { apiKey, apiSecret } = settings();
  const response = await fetch(url, { ...init, headers: { "lumen-api-key": apiKey, "lumen-api-secret": apiSecret, ...init.headers }, cache: "no-store" });
  const payload = await response.json().catch(() => undefined) as LumenEnvelope<T> | { error?: { code?: string; message?: string }; message?: string } | undefined;
  if (!response.ok) {
    const error = payload as { error?: { code?: string; message?: string }; message?: string } | undefined;
    throw new LumenError(response.status, error?.error?.message ?? error?.message ?? `Lumen OCR request failed (${response.status}).`, error?.error?.code);
  }
  return payload as LumenEnvelope<T>;
}

export async function uploadToLumen(file: File) {
  validateUpload(file);
  const { endpoint } = settings();
  return lumenFetch<LumenDocument>(endpoint, { method: "POST", headers: { "Content-Type": file.type, "X-Lumen-Document-Name": encodeURIComponent(file.name) }, body: await file.arrayBuffer() });
}

export async function getLumenDocument(providerDocumentId: string) {
  const { endpoint } = settings();
  return lumenFetch<LumenDocument>(`${endpoint}/${encodeURIComponent(providerDocumentId)}`);
}

export async function retryLumenDocument(providerDocumentId: string) {
  const { endpoint } = settings();
  return lumenFetch<LumenDocument>(`${endpoint}/${encodeURIComponent(providerDocumentId)}/retry`, { method: "POST" });
}

function extractPageText(payload: unknown) {
  const data = payload as { Pages?: LumenPage[]; Items?: LumenPage[] } | LumenPage[];
  const pages = Array.isArray(data) ? data : data.Pages ?? data.Items ?? [];
  return pages.map((page) => {
    const words = page.Words ?? page.words;
    const lines = page.Lines ?? page.lines;
    return page.Text
      ?? page.RecognizedText
      ?? page.Content
      ?? page.text
      ?? lines?.map((line) => line.Text ?? line.text ?? (line.Words ?? line.words ?? []).map((word) => word.Text ?? word.Value ?? word.text ?? "").join(" ")).join("\n")
      ?? words?.map((word) => word.Text ?? word.Value ?? word.text ?? "").join(" ")
      ?? "";
  }).filter(Boolean).join("\n\n");
}

export async function syncLumenDocument(providerDocumentId: string) {
  const record = await getLumenDocument(providerDocumentId);
  const providerStatus = record.data.Status.toUpperCase();
  if (FINAL_SUCCESS_STATUSES.has(providerStatus)) {
    const { endpoint } = settings();
    const pages = await lumenFetch<unknown>(`${endpoint}/${encodeURIComponent(providerDocumentId)}/pages?IncludeWords=true`);
    return { status: "complete" as const, text: extractPageText(pages.data), providerStatus };
  }
  if (providerStatus === "FAILED") return { status: "failed" as const, error: record.data.FailureReason ?? "Lumen OCR could not read this document.", providerStatus };
  return { status: "pending" as const, providerStatus };
}
