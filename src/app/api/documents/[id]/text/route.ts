import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { serializeDocument } from "@/lib/server/documents";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const body = await request.json() as { ocrText?: unknown; ocrStatus?: unknown };
    if (typeof body.ocrText !== "string") return NextResponse.json({ error: "ocrText must be a string." }, { status: 400 });
    if (body.ocrStatus !== undefined && body.ocrStatus !== "pending" && body.ocrStatus !== "complete" && body.ocrStatus !== "failed") return NextResponse.json({ error: "Invalid OCR status." }, { status: 400 });
    const [record] = await getDb().update(documents).set({ ocrText: body.ocrText, ocrStatus: body.ocrStatus ?? "complete", ocrError: null }).where(eq(documents.id, (await params).id)).returning();
    return record ? NextResponse.json({ document: serializeDocument(record) }) : NextResponse.json({ error: "Document not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to save OCR text." }, { status: 500 });
  }
}
