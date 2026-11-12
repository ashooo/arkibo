import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { checklistTracks, requirements } from "@/db/schema";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { checklistView, ChecklistError, track, validDeadline } from "@/lib/server/checklist";

function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to save or load your checklist." }, { status: error instanceof ChecklistError ? error.status : 500 });
}
export async function GET(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try { return NextResponse.json(await checklistView(access.studentId, track(new URL(request.url).searchParams.get("type"))), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    const applicationType = track(body.applicationType);
    const deadline = validDeadline(body.deadline);
    await getDb().insert(checklistTracks).values({ studentId: access.studentId, applicationType, deadline }).onConflictDoUpdate({ target: [checklistTracks.studentId, checklistTracks.applicationType], set: { deadline, updatedAt: new Date() } });
    return NextResponse.json({ deadline: deadline ?? "" });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    const applicationType = track(body.applicationType);
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 10000))) throw new ChecklistError("Enter a title up to 200 characters and description up to 10,000 characters.");
    const existing = await getDb().select({ id: requirements.id }).from(requirements).where(and(eq(requirements.studentId, access.studentId), eq(requirements.applicationType, applicationType)));
    const [row] = await getDb().insert(requirements).values({ studentId: access.studentId, applicationType, title: body.title.trim(), description: body.description?.trim() || "Additional requirement added to your checklist.", sortOrder: 100 + existing.length, sourceNote: "Custom requirement entered by the account holder." }).returning();
    return NextResponse.json({ requirement: { id: row.id, title: row.title, description: row.description, applicationType, sortOrder: row.sortOrder } }, { status: 201 });
  } catch (error) { return failure(error); }
}
