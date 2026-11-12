import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";
import { LumenError, retryLumenDocument } from "@/lib/server/lumen";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const id = (await params).id;
    const [document] = await getDb().select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (!document.providerDocumentId) return NextResponse.json({ error: "This document was not accepted by Lumen OCR." }, { status: 409 });
    if (document.ocrStatus !== "failed") return NextResponse.json({ error: "Only failed OCR jobs can be retried." }, { status: 409 });
    await retryLumenDocument(document.providerDocumentId);
    const [updated] = await getDb().update(documents).set({ ocrStatus: "pending", ocrError: null, ocrText: null }).where(eq(documents.id, id)).returning();
    return NextResponse.json({ document: serializeDocument(updated) }, { status: 202 });
  } catch (error) {
    if (error instanceof LumenError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "Unable to retry OCR." }, { status: 500 });
  }
}
