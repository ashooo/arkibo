import type { InferSelectModel } from "drizzle-orm";
import { documents } from "@/db/schema";
import type { StoredDocument } from "@/types/shared";

type DocumentRecord = InferSelectModel<typeof documents>;

export function serializeDocument(record: DocumentRecord): StoredDocument {
  return {
    id: record.id,
    studentId: record.studentId,
    originalName: record.originalName,
    mimeType: record.mimeType,
    category: record.category,
    providerDocumentId: record.providerDocumentId,
    ocrText: record.ocrText,
    ocrStatus: record.ocrStatus,
    ocrError: record.ocrError,
    uploadedAt: record.uploadedAt.toISOString(),
  };
}

export function searchSnippet(text: string | null, query: string) {
  if (!text || !query) return null;
  const offset = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (offset < 0) return null;
  const start = Math.max(0, offset - 80);
  const end = Math.min(text.length, offset + query.length + 120);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}
