import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "OCR is not configured. Verify the Lumen endpoint and credentials." },
    { status: 501 },
  );
}
