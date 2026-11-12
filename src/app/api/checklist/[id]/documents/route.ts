import { NextResponse } from "next/server";

export async function POST() { return NextResponse.json({ error: "Checklist document attachments are not configured." }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: "Checklist document attachments are not configured." }, { status: 501 }); }
