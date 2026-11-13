import { workspaceAccess } from "@/lib/server/workspace-access";
import { after, NextResponse } from "next/server";
import { serializeDocument } from "@/lib/server/documents";
import { LumenError } from "@/lib/server/lumen";
import { classifyDocument } from "@/lib/server/document-classifier";
import { checkDocumentOcr } from "@/lib/server/document-ocr";

export const maxDuration = 300;

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const access = await workspaceAccess(_request);
  if (access.error) return access.error;
  try {
    const id = (await params).id;
    const { document, providerStatus } = await checkDocumentOcr(access.studentId, id);
    if (document.ocrStatus === "pending" && !document.providerDocumentId) return NextResponse.json({ error: "This document was not accepted by Lumen OCR." }, { status: 409 });
    if (document.ocrStatus === "complete") after(async () => { await classifyDocument(access.studentId, id).catch(() => undefined); });
    return NextResponse.json({ document: serializeDocument(document), providerStatus }, { status: document.ocrStatus === "pending" ? 202 : 200 });
  } catch (error) {
    if (error instanceof LumenError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "Unable to synchronize OCR results." }, { status: 500 });
  }
}
