import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { gradeEntries } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const termId = new URL(request.url).searchParams.get("termId");
    if (!termId) return NextResponse.json({ error: "termId is required." }, { status: 400 });
    return NextResponse.json({ grades: await getDb().select().from(gradeEntries).where(eq(gradeEntries.termId, termId)).orderBy(asc(gradeEntries.subjectCode)) });
  } catch { return NextResponse.json({ error: "Unable to load grades." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { termId?: unknown; sourceDocumentId?: unknown; subjectCode?: unknown; subjectName?: unknown; grade?: unknown; verified?: unknown };
    if (typeof body.termId !== "string" || typeof body.subjectCode !== "string" || typeof body.subjectName !== "string" || typeof body.grade !== "string") return NextResponse.json({ error: "Term, subject code, subject name, and grade are required." }, { status: 400 });
    const [entry] = await getDb().insert(gradeEntries).values({ termId: body.termId, sourceDocumentId: typeof body.sourceDocumentId === "string" ? body.sourceDocumentId : null, subjectCode: body.subjectCode.trim().slice(0, 50), subjectName: body.subjectName.trim().slice(0, 255), grade: body.grade.trim().slice(0, 30), verified: body.verified === true }).returning();
    return NextResponse.json({ grade: entry }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to save this grade." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id?: unknown; subjectCode?: unknown; subjectName?: unknown; grade?: unknown; verified?: unknown };
    if (typeof body.id !== "string") return NextResponse.json({ error: "Grade id is required." }, { status: 400 });
    const [entry] = await getDb().update(gradeEntries).set({ subjectCode: typeof body.subjectCode === "string" ? body.subjectCode.trim().slice(0, 50) : undefined, subjectName: typeof body.subjectName === "string" ? body.subjectName.trim().slice(0, 255) : undefined, grade: typeof body.grade === "string" ? body.grade.trim().slice(0, 30) : undefined, verified: typeof body.verified === "boolean" ? body.verified : undefined }).where(eq(gradeEntries.id, body.id)).returning();
    return entry ? NextResponse.json({ grade: entry }) : NextResponse.json({ error: "Grade entry not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Unable to update this grade." }, { status: 500 }); }
}
