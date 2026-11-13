import { NextResponse } from "next/server";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { ChecklistError, deleteRequirement, editRequirement, updateChecklist } from "@/lib/server/checklist";

function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to save checklist changes." }, { status: error instanceof ChecklistError ? error.status : 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    if (typeof body.listId !== "string") throw new ChecklistError("Choose a checklist.");
    const id = (await params).id;
    // A title in the body means the requirement itself is being renamed or re-described.
    if (body.title !== undefined) return NextResponse.json({ requirement: await editRequirement(access.studentId, body.listId, id, body) });
    return NextResponse.json(await updateChecklist(access.studentId, body.listId, id, body));
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.listId !== "string") throw new ChecklistError("Choose a checklist.");
    await deleteRequirement(access.studentId, body.listId, (await params).id);
    return NextResponse.json({ deleted: true });
  } catch (error) { return failure(error); }
}
