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
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "lumen-api-key": apiKey, "lumen-api-secret": apiSecret, ...init.headers }, cache: "no-store", signal: AbortSignal.timeout(30000) });
  } catch { throw new LumenError(503, "Text extraction is temporarily unreachable. Your saved original is still available."); }
  const payload = await response.json().catch(() => undefined) as LumenEnvelope<T> | { error?: { code?: string; message?: string }; message?: string } | undefined;
  if (!response.ok) {
    const messages: Record<number, string> = { 400: "The extraction service couldn't read this file. Try a clearer copy.", 401: "Text extraction couldn't authenticate. Contact the site administrator.", 403: "Text extraction isn't authorized. Contact the site administrator.", 413: "The extraction service rejected this file as too large.", 415: "The extraction service doesn't support this file format.", 429: "The extraction service is busy. Wait a moment before retrying.", 503: "Text extraction is temporarily unavailable. Please try again later." };
    throw new LumenError(response.status, messages[response.status] ?? "The extraction service couldn't complete this request. Please try again later.");
  }
  if (!payload || typeof payload !== "object" || !("data" in payload) || payload.data === null || payload.data === undefined) throw new LumenError(502, "The extraction service returned an invalid response. Please try again later.");
  return payload as LumenEnvelope<T>;
}

export async function uploadToLumen(file: File) {
  validateUpload(file);
  const { endpoint } = settings();
  const result = await lumenFetch<LumenDocument>(endpoint, { method: "POST", headers: { "Content-Type": file.type, "X-Lumen-Document-Name": encodeURIComponent(file.name) }, body: await file.arrayBuffer() });
  if (typeof result.data?.DocumentID !== "string" || !result.data.DocumentID) throw new LumenError(502, "The extraction service did not return a document reference.");
  return result;
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
  if (!payload || typeof payload !== "object") throw new LumenError(502, "The extraction service returned invalid page data.");
  const data = payload as { Pages?: LumenPage[]; Items?: LumenPage[] } | LumenPage[];
  const pages = Array.isArray(data) ? data : data.Pages ?? data.Items ?? [];
  if (!Array.isArray(pages)) throw new LumenError(502, "The extraction service returned invalid page data.");
  return pages.map((page) => {
    const words = page.Words ?? page.words;
    const lines = page.Lines ?? page.lines;
    const candidates = [page.Text, page.RecognizedText, page.Content, page.text,
      lines?.map((line) => line.Text ?? line.text ?? (line.Words ?? line.words ?? []).map((word) => word.Text ?? word.Value ?? word.text ?? "").join(" ")).join("\n"),
      words?.map((word) => word.Text ?? word.Value ?? word.text ?? "").join(" ")];
    return candidates.find((candidate) => typeof candidate === "string" && candidate.trim()) ?? "";
  }).filter(Boolean).join("\n\n");
}

export async function syncLumenDocument(providerDocumentId: string) {
  const record = await getLumenDocument(providerDocumentId);
  if (typeof record.data?.Status !== "string") throw new LumenError(502, "The extraction service returned an invalid status.");
  const providerStatus = record.data.Status.toUpperCase();
  if (FINAL_SUCCESS_STATUSES.has(providerStatus)) {
    const { endpoint } = settings();
    const pages = await lumenFetch<unknown>(`${endpoint}/${encodeURIComponent(providerDocumentId)}/pages?IncludeWords=true`);
    return { status: "complete" as const, text: extractPageText(pages.data), providerStatus };
  }
  if (providerStatus === "FAILED") return { status: "failed" as const, error: "Text extraction couldn't read this document. Try a clearer copy or retry extraction.", providerStatus };
  return { status: "pending" as const, providerStatus };
}
