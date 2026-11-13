import { NextResponse } from "next/server";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { ChecklistError, updateChecklist } from "@/lib/server/checklist";

type Context = { params: Promise<{ id: string }> };
async function change(request: Request, context: Context, action: "append" | "remove") {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    if (typeof body.listId !== "string") throw new ChecklistError("Choose a checklist.");
    return NextResponse.json(await updateChecklist(access.studentId, body.listId, (await context.params).id, body, action));
  } catch (error) {
    return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to update the attachment." }, { status: error instanceof ChecklistError ? error.status : 500 });
  }
}
export async function POST(request: Request, context: Context) { return change(request, context, "append"); }
export async function DELETE(request: Request, context: Context) { return change(request, context, "remove"); }
