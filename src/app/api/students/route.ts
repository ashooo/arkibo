import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { students } from "@/db/schema";

export async function GET() {
  try {
    const profiles = await getDb().select().from(students).orderBy(asc(students.createdAt));
    return NextResponse.json({ students: profiles.map(({ id, displayName, applicationType }) => ({ id, displayName, applicationType })) });
  } catch { return NextResponse.json({ error: "Unable to load student profiles." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { displayName?: unknown; applicationType?: unknown };
    if (typeof body.displayName !== "string" || !body.displayName.trim()) return NextResponse.json({ error: "A display name is required." }, { status: 400 });
    if (body.applicationType !== "new" && body.applicationType !== "renewal") return NextResponse.json({ error: "Choose New Applicant or Renewal Scholar." }, { status: 400 });
    const [student] = await getDb().insert(students).values({ displayName: body.displayName.trim().slice(0, 160), applicationType: body.applicationType }).returning();
    return NextResponse.json({ student: { id: student.id, displayName: student.displayName, applicationType: student.applicationType } }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create the student profile." }, { status: 500 }); }
}
