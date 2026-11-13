import { workspaceAccess } from "@/lib/server/workspace-access";
import { after, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";
import { classifyDocument } from "@/lib/server/document-classifier";

export const maxDuration = 300;

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json() as { ocrText?: unknown; ocrStatus?: unknown };
    if (typeof body.ocrText !== "string") return NextResponse.json({ error: "ocrText must be a string." }, { status: 400 });
    if (body.ocrStatus !== undefined && body.ocrStatus !== "pending" && body.ocrStatus !== "complete" && body.ocrStatus !== "failed") return NextResponse.json({ error: "Invalid OCR status." }, { status: 400 });
    const [record] = await getDb().update(documents).set({ ocrText: body.ocrText, ocrStatus: body.ocrStatus ?? "complete", ocrError: null, classificationStatus: "pending", classificationInputHash: null, classificationError: null, metadataVersion: sql`${documents.metadataVersion} + 1` }).where(eq(documents.id, (await params).id)).returning();
    if (record?.ocrStatus === "complete") after(async () => { await classifyDocument(access.studentId, record.id).catch(() => undefined); });
    return record ? NextResponse.json({ document: serializeDocument(record) }) : NextResponse.json({ error: "Document not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to save OCR text." }, { status: 500 });
  }
}
