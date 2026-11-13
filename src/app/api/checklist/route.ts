import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { checklistLists, requirements } from "@/db/schema";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { checklistView, ChecklistError, createChecklistFolder, validDeadline } from "@/lib/server/checklist";

function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to save or load your checklist." }, { status: error instanceof ChecklistError ? error.status : 500 });
}
export async function GET(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try { const url = new URL(request.url); return NextResponse.json(await checklistView(access.studentId, url.searchParams.get("listId") ?? undefined), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    const deadline = validDeadline(body.deadline);
    if (typeof body.listId !== "string") throw new ChecklistError("Choose a checklist.");
    const [updated] = await getDb().update(checklistLists).set({ deadline }).where(and(eq(checklistLists.id, body.listId), eq(checklistLists.studentId, access.studentId))).returning();
    if (!updated) throw new ChecklistError("Checklist not found.", 404);
    return NextResponse.json({ deadline: deadline ?? "" });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name || name.length > 100) throw new ChecklistError("Enter a checklist name up to 100 characters.");
      const template = body.template ?? "empty";
      if (!["empty", "new", "renewal"].includes(template)) throw new ChecklistError("Choose a supported folder template.");
      const list = await createChecklistFolder(access.studentId, name, template);
      return NextResponse.json({ list, ...(await checklistView(access.studentId, list.id)) }, { status: 201 });
    }
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 10000))) throw new ChecklistError("Enter a title up to 200 characters and description up to 10,000 characters.");
    if (typeof body.listId !== "string") throw new ChecklistError("Choose a checklist.");
    const [list] = await getDb().select().from(checklistLists).where(and(eq(checklistLists.id, body.listId), eq(checklistLists.studentId, access.studentId))).limit(1);
    if (!list) throw new ChecklistError("Checklist not found.", 404);
    const existing = await getDb().select({ id: requirements.id }).from(requirements).where(and(eq(requirements.studentId, access.studentId), eq(requirements.checklistListId, list.id)));
    const [row] = await getDb().insert(requirements).values({ studentId: access.studentId, checklistListId: list.id, applicationType: list.applicationType, title: body.title.trim(), description: body.description?.trim() || "Additional requirement added to your checklist.", sortOrder: 100 + existing.length, sourceNote: "Custom requirement entered by the account holder." }).returning();
    return NextResponse.json({ requirement: { id: row.id, title: row.title, description: row.description, applicationType: list.applicationType, sortOrder: row.sortOrder } }, { status: 201 });
  } catch (error) { return failure(error); }
}
