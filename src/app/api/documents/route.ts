import { NextResponse } from "next/server";

export async function GET() { return NextResponse.json({ documents: [] }); }
export async function POST() { return NextResponse.json({ error: "Document storage is not configured." }, { status: 501 }); }
