import { NextResponse } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { searchSnippet, serializeDocument } from "@/lib/server/documents";
import { LumenError, uploadToLumen } from "@/lib/server/lumen";
import { removeStoredUpload, storeUpload, UploadValidationError } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const where = query ? or(ilike(documents.originalName, `%${query}%`), ilike(documents.ocrText, `%${query}%`)) : undefined;
    const rows = await getDb().select().from(documents).where(where).orderBy(desc(documents.uploadedAt)).limit(50);
    return NextResponse.json({ documents: rows.map((row) => ({ ...serializeDocument(row), snippet: searchSnippet(row.ocrText, query) })) });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve documents." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let storagePath: string | undefined;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A file field is required." }, { status: 400 });
    const category = typeof formData.get("category") === "string" ? String(formData.get("category")).slice(0, 80) || "others" : "others";
    const studentId = typeof formData.get("studentId") === "string" ? String(formData.get("studentId")).trim() || null : null;
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
