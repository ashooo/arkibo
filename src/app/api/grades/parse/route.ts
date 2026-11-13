import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { parseGradeDrafts } from "@/lib/server/grade-parser";

export async function POST(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json() as { documentId?: unknown };
    if (typeof body.documentId !== "string") return NextResponse.json({ error: "documentId is required." }, { status: 400 });
    const [document] = await getDb().select({ ocrText: documents.ocrText, ocrStatus: documents.ocrStatus }).from(documents).where(eq(documents.id, body.documentId)).limit(1);
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (document.ocrStatus !== "complete" || !document.ocrText) return NextResponse.json({ error: "OCR text is not available for this document." }, { status: 409 });
    return NextResponse.json({ drafts: parseGradeDrafts(document.ocrText) });
  } catch { return NextResponse.json({ error: "Unable to parse grade drafts." }, { status: 500 }); }
}
