import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { checklistDocuments, checklistItems, checklistLists, documents, requirements } from "@/db/schema";
import { requirementTemplates } from "@/data/requirements";
import type { ChecklistStatus } from "@/types/shared";

export class ChecklistError extends Error {
  constructor(message: string, public status = 400) { super(message); }
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

export const DEFAULT_FOLDER_NAME = "Renewal Requirements";
const LEGACY_DEFAULT_NAME = "Application Checklist";

// Gives every account a default folder seeded with the renewal requirements.
// Also upgrades the old, still-empty "Application Checklist" default so existing users get the same folder.
async function ensureDefaultFolder(studentId: string) {
  await getDb().transaction(async (tx) => {
    // Serialize concurrent first loads for the same student so only one default folder is created.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${studentId}))`);
    const lists = await tx.select().from(checklistLists).where(eq(checklistLists.studentId, studentId)).orderBy(asc(checklistLists.createdAt), asc(checklistLists.id));
    let target = lists.length ? null : (await tx.insert(checklistLists).values({ studentId, applicationType: "renewal", name: DEFAULT_FOLDER_NAME }).returning())[0];
    if (!target && lists[0].name === LEGACY_DEFAULT_NAME) {
      const [existing] = await tx.select({ id: requirements.id }).from(requirements).where(eq(requirements.checklistListId, lists[0].id)).limit(1);
      if (!existing) [target] = await tx.update(checklistLists).set({ name: DEFAULT_FOLDER_NAME, applicationType: "renewal" }).where(eq(checklistLists.id, lists[0].id)).returning();
    }
    if (!target) return;
    const renewal = requirementTemplates.filter((template) => template.applicationType === "renewal");
    await tx.insert(requirements).values(renewal.map((template) => ({ studentId, checklistListId: target.id, templateKey: template.id, applicationType: "renewal" as const, title: template.title, description: template.description, sortOrder: template.sortOrder, sourceNote: "Default renewal requirement." }))).onConflictDoNothing();
  });
}

async function folderSummaries(studentId: string) {
  const db = getDb();
  const lists = await db.select().from(checklistLists).where(eq(checklistLists.studentId, studentId)).orderBy(asc(checklistLists.createdAt), asc(checklistLists.id));
  const counts = await db.select({
    listId: requirements.checklistListId,
    total: sql<number>`count(distinct ${requirements.id})::int`,
    prepared: sql<number>`count(distinct ${requirements.id}) filter (where ${checklistItems.status} = 'prepared')::int`,
    documents: sql<number>`count(distinct ${checklistDocuments.documentId})::int`,
  }).from(requirements)
    .leftJoin(checklistItems, and(eq(checklistItems.requirementId, requirements.id), eq(checklistItems.studentId, studentId)))
    .leftJoin(checklistDocuments, eq(checklistDocuments.checklistItemId, checklistItems.id))
    .where(eq(requirements.studentId, studentId))
    .groupBy(requirements.checklistListId);
  return lists.map(({ id, name, deadline }) => {
    const count = counts.find((entry) => entry.listId === id);
    return { id, name, deadline: deadline ?? "", total: count?.total ?? 0, prepared: count?.prepared ?? 0, documents: count?.documents ?? 0 };
  });
}

export async function checklistView(studentId: string, requestedListId?: string) {
  const db = getDb();
  await ensureDefaultFolder(studentId);
  const lists = await folderSummaries(studentId);
  const selected = requestedListId ? lists.find((list) => list.id === requestedListId) : lists[0];
  if (!selected) throw new ChecklistError("Checklist not found.", 404);
  const rows = await db.select().from(requirements).where(and(eq(requirements.studentId, studentId), eq(requirements.checklistListId, selected.id))).orderBy(asc(requirements.sortOrder), asc(requirements.id));
  const saved = await db.select({ item: checklistItems, requirement: requirements }).from(checklistItems)
    .innerJoin(requirements, eq(checklistItems.requirementId, requirements.id))
    .where(and(eq(checklistItems.studentId, studentId), eq(requirements.studentId, studentId), eq(requirements.checklistListId, selected.id)));
  const attachments = await db.select({ itemId: checklistDocuments.checklistItemId, documentId: checklistDocuments.documentId }).from(checklistDocuments)
    .innerJoin(checklistItems, eq(checklistItems.id, checklistDocuments.checklistItemId)).innerJoin(documents, eq(documents.id, checklistDocuments.documentId))
    .where(and(eq(checklistItems.studentId, studentId), eq(documents.studentId, studentId)));
  const items = Object.fromEntries(saved.map(({ item, requirement }) => [requirement.templateKey ?? requirement.id, { status: item.status, notes: item.notes ?? "", documentIds: attachments.filter((attachment) => attachment.itemId === item.id).map((attachment) => attachment.documentId) }]));
  const customTemplates = rows.map(({ id, templateKey, title, description, sortOrder, applicationType: type }) => ({ id: templateKey ?? id, title, description, sortOrder, applicationType: type }));
  return { items, customTemplates, deadline: selected.deadline, listId: selected.id, lists };
}

async function resolveRequirement(tx: Transaction, studentId: string, listId: string, key: string) {
  const [list] = await tx.select().from(checklistLists).where(and(eq(checklistLists.id, listId), eq(checklistLists.studentId, studentId))).limit(1);
  if (!list) throw new ChecklistError("Checklist not found.", 404);
  const [row] = await tx.select().from(requirements).where(and(eq(requirements.studentId, studentId), eq(requirements.checklistListId, listId), uuid.test(key) ? eq(requirements.id, key) : eq(requirements.templateKey, key))).limit(1);
  if (!row) throw new ChecklistError("Requirement not found.", 404);
  return row;
}

export async function editRequirement(studentId: string, listId: string, key: string, body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 200) throw new ChecklistError("Enter a requirement name up to 200 characters.");
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 10000)) throw new ChecklistError("Details must be text up to 10,000 characters.");
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  return getDb().transaction(async (tx) => {
    const requirement = await resolveRequirement(tx, studentId, listId, key);
    const [row] = await tx.update(requirements).set({ title, ...(description !== undefined ? { description } : {}) }).where(eq(requirements.id, requirement.id)).returning();
    return { id: row.templateKey ?? row.id, title: row.title, description: row.description, sortOrder: row.sortOrder, applicationType: row.applicationType };
  });
}

// Removes the requirement with its status, notes, and attachment links. Attached files stay in My Documents.
export async function deleteRequirement(studentId: string, listId: string, key: string) {
  await getDb().transaction(async (tx) => {
    const requirement = await resolveRequirement(tx, studentId, listId, key);
    await tx.delete(requirements).where(and(eq(requirements.id, requirement.id), eq(requirements.studentId, studentId)));
  });
}

export async function updateChecklist(studentId: string, listId: string, key: string, body: Record<string, unknown>, attachment?: "append" | "remove") {
  if (body.status !== undefined && (typeof body.status !== "string" || !["missing", "uploaded", "prepared", "needs_attention"].includes(body.status))) throw new ChecklistError("Invalid checklist status.");
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 10000)) throw new ChecklistError("Notes must be text up to 10,000 characters.");
  if (body.documentIds !== undefined && (!Array.isArray(body.documentIds) || body.documentIds.length > 50 || body.documentIds.some((id) => typeof id !== "string" || !uuid.test(id)))) throw new ChecklistError("Provide up to 50 valid document IDs.");
  if (attachment && (typeof body.documentId !== "string" || !uuid.test(body.documentId))) throw new ChecklistError("A valid document ID is required.");
  await getDb().transaction(async (tx) => {
    const requirement = await resolveRequirement(tx, studentId, listId, key);
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
  return checklistView(studentId, listId);
}
