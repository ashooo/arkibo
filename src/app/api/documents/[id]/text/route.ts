import { NextResponse } from "next/server";

export async function PATCH() { return NextResponse.json({ error: "OCR text persistence is not configured." }, { status: 501 }); }
