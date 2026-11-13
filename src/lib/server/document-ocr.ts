import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { syncLumenDocument } from "./lumen";

/** Check an existing OCR job. Never uploads again or retries a failed submission. */
export async function checkDocumentOcr(studentId: string, documentId: string) {
  const db = getDb();
  const scope = and(eq(documents.id, documentId), eq(documents.studentId, studentId));
  const [record] = await db.select().from(documents).where(scope).limit(1);
  if (!record) throw new Error("Document not found.");
  if (record.ocrStatus !== "pending" || !record.providerDocumentId) return { document: record };
  const result = await syncLumenDocument(record.providerDocumentId);
  const [updated] = await db.update(documents).set({
    ocrStatus: result.status,
    ocrText: result.status === "complete" ? result.text : record.ocrText,
    ocrError: result.status === "failed" ? result.error : null,
    ...(result.status === "complete" && result.text !== record.ocrText ? {
      classificationStatus: "pending", classificationInputHash: null, classificationError: null,
      metadataVersion: sql`${documents.metadataVersion} + 1`,
    } : {}),
  }).where(and(scope, eq(documents.metadataVersion, record.metadataVersion), eq(documents.ocrStatus, "pending"), eq(documents.providerDocumentId, record.providerDocumentId))).returning();
  return { document: updated ?? (await db.select().from(documents).where(scope).limit(1))[0] ?? record, providerStatus: result.providerStatus };
}
