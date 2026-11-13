import "server-only";
import { createHash } from "node:crypto";
import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents, requirements, students } from "@/db/schema";
import { requirementTemplates } from "@/data/requirements";
import { CLASSIFICATION_VERSION, classificationMessages, classificationSchema, validateClassification, metadataSearchText, type RequirementCandidate } from "@/lib/ai/document-classification";
import { qwenChat } from "@/lib/ai/ollama";

export async function classificationCandidates(studentId: string) {
  const [student] = await getDb().select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) throw new Error("Student profile not found.");
  const custom = await getDb().select().from(requirements).where(and(eq(requirements.studentId, studentId), eq(requirements.applicationType, student.applicationType), isNull(requirements.templateKey)));
  return [...requirementTemplates.filter((entry) => entry.applicationType === student.applicationType), ...custom].map(({ id, title, description }) => ({ id, title, description }));
}

/** Independent task: never receives or changes chat history, never invokes OCR. */
export async function classifyOcrText(ocrText: string, candidates: RequirementCandidate[]) {
  if (!ocrText.trim()) throw new Error("No readable OCR text is available. Set a category manually or add a clearer document.");
  const messages = classificationMessages(ocrText, candidates);
  const reply = await qwenChat(messages, { format: classificationSchema });
  let parsed: unknown;
  try { parsed = JSON.parse(reply.content); } catch { throw new Error("Local AI returned an invalid classification. Please review this document manually."); }
  return validateClassification(parsed, ocrText.slice(0, 16000), candidates);
}

/** Reused by OCR completion, the review API, assistant tools and future bulk jobs. */
export async function classifyDocument(studentId: string, documentId: string, { refresh = false } = {}) {
  const db = getDb();
  const scope = and(eq(documents.id, documentId), eq(documents.studentId, studentId));
  const [record] = await db.select().from(documents).where(scope).limit(1);
  if (!record) throw new Error("Document not found.");
  if (record.ocrStatus !== "complete" || (record.classificationConfirmedAt && !refresh)) return record;
  const candidates = await classificationCandidates(studentId);
  const hash = createHash("sha256").update(JSON.stringify({ version: CLASSIFICATION_VERSION, model: process.env.QWEN_MODEL ?? "qwen3.5:2b", text: record.ocrText ?? "", candidates })).digest("hex");
  if (!refresh && record.classificationInputHash === hash && ["ready", "needs_review", "failed"].includes(record.classificationStatus)) return record;
  const started = new Date();
  const [claimed] = await db.update(documents).set({ classificationStatus: "processing", classificationInputHash: hash, classificationError: null, classificationUpdatedAt: started }).where(and(scope, eq(documents.metadataVersion, record.metadataVersion), or(ne(documents.classificationStatus, "processing"), lt(documents.classificationUpdatedAt, new Date(Date.now() - 180000)), isNull(documents.classificationUpdatedAt)))).returning();
  if (!claimed) return (await db.select().from(documents).where(scope).limit(1))[0] ?? record;
  const lease = and(scope, eq(documents.metadataVersion, record.metadataVersion), eq(documents.classificationUpdatedAt, started), eq(documents.classificationStatus, "processing"));
  try {
    const classification = await classifyOcrText(record.ocrText ?? "", candidates);
    await db.update(documents).set({ classification, classificationStatus: classification.needsReview ? "needs_review" : "ready", classificationUpdatedAt: new Date(), classificationError: null,
      ...(record.classificationConfirmedAt ? {} : { category: classification.category, tags: classification.tags, searchMetadata: metadataSearchText(classification.category, classification.tags) }),
    }).where(lease);
  } catch (error) {
    await db.update(documents).set({ classificationStatus: "failed", classificationUpdatedAt: new Date(), classificationError: error instanceof Error ? error.message : "Unable to classify this document. You can categorize it manually." }).where(lease);
  }
  return (await db.select().from(documents).where(scope).limit(1))[0] ?? record;
}

export async function confirmDocumentMetadata(studentId: string, documentId: string, category: string, tags: string[], expectedVersion: number) {
  const [record] = await getDb().update(documents).set({ category, tags, searchMetadata: metadataSearchText(category, tags), classificationConfirmedAt: new Date(), classificationStatus: "ready", classificationError: null, metadataVersion: sql`${documents.metadataVersion} + 1` })
    .where(and(eq(documents.id, documentId), eq(documents.studentId, studentId), eq(documents.metadataVersion, expectedVersion))).returning();
  return record;
}
