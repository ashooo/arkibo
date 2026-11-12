import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { checklistDocuments, checklistItems, checklistTracks, documents, requirements } from "@/db/schema";
import { requirementTemplates } from "@/data/requirements";
import type { ApplicationType, ChecklistStatus } from "@/types/shared";

export class ChecklistError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function track(value: unknown): ApplicationType {
  if (value !== "new" && value !== "renewal") throw new ChecklistError("Choose an application track.");
  return value;
}
export function validDeadline(value: unknown): string | null {
  if (value === "" || value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ChecklistError("Enter a valid deadline date.");
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ChecklistError("Enter a valid deadline date.");
  return value;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export async function checklistView(studentId: string, applicationType: ApplicationType) {
  const db = getDb();
  const rows = await db.select().from(requirements).where(and(eq(requirements.studentId, studentId), eq(requirements.applicationType, applicationType))).orderBy(asc(requirements.sortOrder), asc(requirements.id));
  const saved = await db.select({ item: checklistItems, requirement: requirements }).from(checklistItems)
    .innerJoin(requirements, eq(checklistItems.requirementId, requirements.id))
    .where(and(eq(checklistItems.studentId, studentId), eq(requirements.studentId, studentId), eq(requirements.applicationType, applicationType)));
  const attachments = await db.select({ itemId: checklistDocuments.checklistItemId, documentId: checklistDocuments.documentId }).from(checklistDocuments)
    .innerJoin(checklistItems, eq(checklistItems.id, checklistDocuments.checklistItemId)).innerJoin(documents, eq(documents.id, checklistDocuments.documentId))
    .where(and(eq(checklistItems.studentId, studentId), eq(documents.studentId, studentId)));
  const items = Object.fromEntries(saved.map(({ item, requirement }) => [requirement.templateKey ?? requirement.id, { status: item.status, notes: item.notes ?? "", documentIds: attachments.filter((attachment) => attachment.itemId === item.id).map((attachment) => attachment.documentId) }]));
  const customTemplates = rows.filter((row) => !row.templateKey).map(({ id, title, description, sortOrder }) => ({ id, title, description, sortOrder, applicationType }));
  const [settings] = await db.select().from(checklistTracks).where(and(eq(checklistTracks.studentId, studentId), eq(checklistTracks.applicationType, applicationType)));
  return { items, customTemplates, deadline: settings?.deadline ?? "" };
}

async function resolveRequirement(tx: Transaction, studentId: string, applicationType: ApplicationType, key: string) {
  const template = requirementTemplates.find((entry) => entry.id === key && entry.applicationType === applicationType);
  if (template) {
    const [row] = await tx.insert(requirements).values({ studentId, templateKey: key, applicationType, title: template.title, description: template.description, sortOrder: template.sortOrder, sourceNote: "User-supplied checklist template; verify with the scholarship office." })
      .onConflictDoUpdate({ target: [requirements.studentId, requirements.templateKey], set: { title: template.title } }).returning();
    return row;
  }
  const [row] = uuid.test(key) ? await tx.select().from(requirements).where(and(eq(requirements.id, key), eq(requirements.studentId, studentId), eq(requirements.applicationType, applicationType))).limit(1) : [];
  if (!row) throw new ChecklistError("Requirement not found.", 404);
  return row;
}

export async function updateChecklist(studentId: string, applicationType: ApplicationType, key: string, body: Record<string, unknown>, attachment?: "append" | "remove") {
  if (body.status !== undefined && (typeof body.status !== "string" || !["missing", "uploaded", "prepared", "needs_attention"].includes(body.status))) throw new ChecklistError("Invalid checklist status.");
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 10000)) throw new ChecklistError("Notes must be text up to 10,000 characters.");
  if (body.documentIds !== undefined && (!Array.isArray(body.documentIds) || body.documentIds.length > 50 || body.documentIds.some((id) => typeof id !== "string" || !uuid.test(id)))) throw new ChecklistError("Provide up to 50 valid document IDs.");
  if (attachment && (typeof body.documentId !== "string" || !uuid.test(body.documentId))) throw new ChecklistError("A valid document ID is required.");
  await getDb().transaction(async (tx) => {
    const requirement = await resolveRequirement(tx, studentId, applicationType, key);
    const [item] = await tx.insert(checklistItems).values({ studentId, requirementId: requirement.id })
      .onConflictDoUpdate({ target: [checklistItems.studentId, checklistItems.requirementId], set: { updatedAt: new Date() } }).returning();
    // Upsert locks the item, serializing attachment replacements and note/status writes.
    if (body.status !== undefined || body.notes !== undefined) await tx.update(checklistItems).set({ status: body.status as ChecklistStatus | undefined, notes: body.notes as string | undefined }).where(eq(checklistItems.id, item.id));
    const ids = [...new Set((attachment ? [body.documentId] : body.documentIds ?? []) as string[])];
    if (ids.length) {
      const owned = await tx.select({ id: documents.id }).from(documents).where(and(inArray(documents.id, ids), eq(documents.studentId, studentId)));
      if (owned.length !== ids.length) throw new ChecklistError("Document not found.", 404);
    }
    if (attachment === "remove") {
      await tx.delete(checklistDocuments).where(and(eq(checklistDocuments.checklistItemId, item.id), eq(checklistDocuments.documentId, ids[0])));
    } else if (attachment || body.documentIds !== undefined) {
      if (!attachment || body.replace === true) await tx.delete(checklistDocuments).where(eq(checklistDocuments.checklistItemId, item.id));
      if (ids.length) await tx.insert(checklistDocuments).values(ids.map((documentId) => ({ checklistItemId: item.id, documentId }))).onConflictDoNothing();
    }
    if (body.status === undefined && (attachment || body.documentIds !== undefined)) {
      const linked = await tx.select({ documentId: checklistDocuments.documentId }).from(checklistDocuments).where(eq(checklistDocuments.checklistItemId, item.id)).limit(1);
      if ((linked.length && item.status === "missing") || (!linked.length && item.status === "uploaded")) {
        await tx.update(checklistItems).set({ status: linked.length ? "uploaded" : "missing" }).where(eq(checklistItems.id, item.id));
      }
    }
  });
  return checklistView(studentId, applicationType);
}
