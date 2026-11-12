import { NextResponse } from "next/server";

export async function GET() { return NextResponse.json({ terms: [] }); }
export async function POST() { return NextResponse.json({ error: "Academic term persistence is not configured." }, { status: 501 }); }
