import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { checklistDocuments, checklistItems, documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";
import { removeStoredUpload } from "@/lib/server/uploads";

type Context = { params: Promise<{ id: string }> };

async function findDocument(id: string) {
  const [record] = await getDb().select().from(documents).where(eq(documents.id, id)).limit(1);
  return record;
}

export async function GET(_request: Request, { params }: Context) {
  const access = await workspaceAccess(_request);
  if (access.error) return access.error;
  try {
    const record = await findDocument((await params).id);
    return record ? NextResponse.json({ document: serializeDocument(record) }) : NextResponse.json({ error: "Document not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve this document." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await workspaceAccess(_request);
  if (access.error) return access.error;
  try {
    const record = await findDocument((await params).id);
    if (!record) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    await removeStoredUpload(record.storagePath);
    await getDb().transaction(async (tx) => {
      // Block new foreign-key attachments while collecting links and deleting the document.
      await tx.select({ id: documents.id }).from(documents).where(and(eq(documents.id, record.id), eq(documents.studentId, access.studentId))).for("update");
      const linked = await tx.select({ id: checklistItems.id }).from(checklistItems)
        .innerJoin(checklistDocuments, eq(checklistDocuments.checklistItemId, checklistItems.id))
        .where(and(eq(checklistDocuments.documentId, record.id), eq(checklistItems.studentId, access.studentId)));
      await tx.delete(documents).where(and(eq(documents.id, record.id), eq(documents.studentId, access.studentId)));
      if (linked.length) await tx.update(checklistItems).set({ status: "missing" }).where(and(
        eq(checklistItems.studentId, access.studentId), eq(checklistItems.status, "uploaded"), inArray(checklistItems.id, linked.map((item) => item.id)),
        sql`not exists (select 1 from ${checklistDocuments} where ${checklistDocuments.checklistItemId} = ${checklistItems.id})`,
      ));
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to delete this local document." }, { status: 500 });
  }
}
