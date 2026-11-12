import { NextResponse } from "next/server";
import { LumenError, uploadToLumen } from "@/lib/server/lumen";
import { UploadValidationError } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A file field is required." }, { status: 400 });
    const response = await uploadToLumen(file);
    return NextResponse.json({ providerDocumentId: response.data.DocumentID, status: "pending", requestId: response.requestId }, { status: 202 });
  } catch (error) {
    if (error instanceof UploadValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof LumenError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "Unable to send this file to Lumen OCR." }, { status: 500 });
  }
}
