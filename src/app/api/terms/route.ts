import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicTerms } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const studentId = new URL(request.url).searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    const terms = await getDb().select().from(academicTerms).where(eq(academicTerms.studentId, studentId)).orderBy(asc(academicTerms.academicYear), asc(academicTerms.semester));
    return NextResponse.json({ terms });
  } catch { return NextResponse.json({ error: "Unable to load academic terms." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { studentId?: unknown; academicYear?: unknown; semester?: unknown };
    if (typeof body.studentId !== "string" || typeof body.academicYear !== "string" || typeof body.semester !== "string") return NextResponse.json({ error: "studentId, academicYear, and semester are required." }, { status: 400 });
    const [term] = await getDb().insert(academicTerms).values({ studentId: body.studentId, academicYear: body.academicYear.trim().slice(0, 20), semester: body.semester.trim().slice(0, 80) }).returning();
    return NextResponse.json({ term }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create this academic term. It may already exist." }, { status: 409 }); }
}
