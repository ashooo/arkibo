import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";
import { LumenError, syncLumenDocument } from "@/lib/server/lumen";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const access = await workspaceAccess(_request);
  if (access.error) return access.error;
  try {
    const id = (await params).id;
    const [record] = await getDb().select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!record) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (!record.providerDocumentId) return NextResponse.json({ error: "This document was not accepted by Lumen OCR." }, { status: 409 });
    const result = await syncLumenDocument(record.providerDocumentId);
    const [updated] = await getDb().update(documents).set({
      ocrStatus: result.status,
      ocrText: result.status === "complete" ? result.text : record.ocrText,
      ocrError: result.status === "failed" ? result.error : null,
    }).where(eq(documents.id, id)).returning();
    return NextResponse.json({ document: serializeDocument(updated), providerStatus: result.providerStatus }, { status: result.status === "pending" ? 202 : 200 });
  } catch (error) {
    if (error instanceof LumenError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "Unable to synchronize OCR results." }, { status: 500 });
  }
}
