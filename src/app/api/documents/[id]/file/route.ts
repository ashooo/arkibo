import { workspaceAccess } from "@/lib/server/workspace-access";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { readStoredUpload } from "@/lib/server/uploads";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const access = await workspaceAccess(_request);
  if (access.error) return access.error;
  try {
    const [document] = await getDb().select().from(documents).where(eq(documents.id, (await params).id)).limit(1);
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const content = await readStoredUpload(document.storagePath);
    return new NextResponse(content, { headers: { "Content-Type": document.mimeType, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.originalName)}`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "The stored file is unavailable." }, { status: 404 });
  }
}
