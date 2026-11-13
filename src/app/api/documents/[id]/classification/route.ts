import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { classificationCandidates, classifyDocument, confirmDocumentMetadata } from "@/lib/server/document-classifier";
import { cleanUserTags, isDocumentCategory } from "@/lib/ai/document-classification";
import { serializeDocument } from "@/lib/server/documents";

export const maxDuration = 300;
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const [record] = await getDb().select().from(documents).where(and(eq(documents.id, (await params).id), eq(documents.studentId, access.studentId))).limit(1);
    if (!record) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    return NextResponse.json({ document: serializeDocument(record), requirements: await classificationCandidates(access.studentId) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load classification." }, { status: 500 }); }
}
export async function POST(request: Request, { params }: Context) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json().catch(() => ({}));
    const record = await classifyDocument(access.studentId, (await params).id, { refresh: body.refresh === true });
    return NextResponse.json({ document: serializeDocument(record) });
  } catch { return NextResponse.json({ error: "Unable to classify this document. You can still edit its category manually." }, { status: 503 }); }
}
export async function PATCH(request: Request, { params }: Context) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    if (!isDocumentCategory(body.category) || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 0) return NextResponse.json({ error: "Choose a supported category and reload the current document version." }, { status: 400 });
    let tags: string[];
    try { tags = cleanUserTags(body.tags); } catch { return NextResponse.json({ error: "Use up to 16 tags, each 1–64 characters." }, { status: 400 }); }
    const record = await confirmDocumentMetadata(access.studentId, (await params).id, body.category, tags, body.expectedVersion);
    return record ? NextResponse.json({ document: serializeDocument(record) }) : NextResponse.json({ error: "This document changed. Reload it before saving your edits." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Unable to save document details." }, { status: 500 }); }
}
