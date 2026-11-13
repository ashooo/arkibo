import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";
import { LumenError, retryLumenDocument, uploadToLumen } from "@/lib/server/lumen";
import { readStoredUpload } from "@/lib/server/uploads";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const access = await workspaceAccess(_request);
  if (access.error) return access.error;
  try {
    const id = (await params).id;
    const [document] = await getDb().select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (document.ocrStatus !== "failed") return NextResponse.json({ error: "Only failed OCR jobs can be retried." }, { status: 409 });
    const [claimed] = await getDb().update(documents).set({ ocrStatus: "pending", ocrError: null }).where(and(eq(documents.id, id), eq(documents.ocrStatus, "failed"))).returning();
    if (!claimed) return NextResponse.json({ error: "Extraction is already being retried." }, { status: 409 });
    try {
      let providerDocumentId = document.providerDocumentId;
      if (providerDocumentId) await retryLumenDocument(providerDocumentId);
      else {
        const bytes = await readStoredUpload(document.storagePath);
        const result = await uploadToLumen(new File([new Uint8Array(bytes)], document.originalName, { type: document.mimeType }));
        providerDocumentId = result.data.DocumentID;
      }
      const [updated] = await getDb().update(documents).set({ providerDocumentId, ocrStatus: "pending", ocrError: null }).where(eq(documents.id, id)).returning();
      return NextResponse.json({ document: serializeDocument(updated) }, { status: 202 });
    } catch (error) {
      await getDb().update(documents).set({ ocrStatus: "failed", ocrError: error instanceof LumenError ? error.message : "Unable to retry extraction. Your original is still saved." }).where(eq(documents.id, id));
      throw error;
    }
  } catch (error) {
    if (error instanceof LumenError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "Unable to retry OCR." }, { status: 500 });
  }
}
