import { NextResponse } from "next/server";

export async function GET() { return NextResponse.json({ grades: [] }); }
export async function POST() { return NextResponse.json({ error: "Grade persistence is not configured." }, { status: 501 }); }
export async function PATCH() { return NextResponse.json({ error: "Grade persistence is not configured." }, { status: 501 }); }
