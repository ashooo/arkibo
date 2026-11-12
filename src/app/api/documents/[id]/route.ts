import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
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
    await getDb().delete(documents).where(eq(documents.id, record.id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to delete this local document." }, { status: 500 });
  }
}
