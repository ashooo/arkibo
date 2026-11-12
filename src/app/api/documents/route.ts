import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";
import { searchDocuments } from "@/lib/server/document-search";
import { LumenError, uploadToLumen } from "@/lib/server/lumen";
import { removeStoredUpload, storeUpload, UploadValidationError } from "@/lib/server/uploads";
import { MAX_DOCUMENT_BYTES } from "@/lib/document-upload";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    return NextResponse.json({ documents: await searchDocuments(query, access.studentId) });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve documents." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return NextResponse.json({ error: "Choose a document to upload." }, { status: 415 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DOCUMENT_BYTES + 64 * 1024) return NextResponse.json({ error: "This upload exceeds the 10 MiB file limit." }, { status: 413 });
  let storagePath: string | undefined;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A file field is required." }, { status: 400 });
    const category = typeof formData.get("category") === "string" ? String(formData.get("category")).slice(0, 80) || "others" : "others";
    const studentId = access.studentId;
    storagePath = await storeUpload(file);
    const [record] = await getDb().insert(documents).values({ studentId, originalName: file.name, mimeType: file.type, storagePath, category }).returning();
    try {
      const lumen = await uploadToLumen(file);
      const [updated] = await getDb().update(documents).set({ providerDocumentId: lumen.data.DocumentID }).where(eq(documents.id, record.id)).returning();
      return NextResponse.json({ document: serializeDocument(updated), requestId: lumen.requestId }, { status: 202 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to schedule OCR.";
      const [updated] = await getDb().update(documents).set({ ocrStatus: "failed", ocrError: message }).where(eq(documents.id, record.id)).returning();
      const status = error instanceof LumenError ? error.status : 502;
      return NextResponse.json({ error: message, document: serializeDocument(updated) }, { status });
    }
  } catch (error) {
    if (storagePath) await removeStoredUpload(storagePath);
    if (error instanceof UploadValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to store this document." }, { status: 500 });
  }
}
