import { NextResponse } from "next/server";

export async function GET() { return NextResponse.json({ error: "Document retrieval is not configured." }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: "Document deletion is not configured." }, { status: 501 }); }
